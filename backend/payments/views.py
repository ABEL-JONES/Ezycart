"""
Views for the payments app.
Handles Razorpay order creation and server-side signature verification.

IMPORTANT SECURITY NOTES:
- RAZORPAY_KEY_SECRET is NEVER sent to the frontend.
- Payment status is ONLY updated after backend signature verification.
- We never trust payment_id or amount from the frontend alone.

PRODUCTION WEBHOOKS:
For production, also configure Razorpay webhooks to handle payment failures
and edge cases (e.g. user closes browser after payment but before verification).
Razorpay will POST to your /api/payments/webhook/ endpoint with event data.
Verify the webhook signature using RAZORPAY_WEBHOOK_SECRET.
"""
import hmac
import hashlib
import logging

from django.conf import settings
from django.db import transaction
from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from orders.models import Order
from .models import Payment
from .serializers import CreateOrderSerializer, VerifyPaymentSerializer, PaymentSerializer

logger = logging.getLogger(__name__)

def is_razorpay_configured():
    """Returns True only if actual Razorpay credentials are set (not defaults/placeholders)."""
    key_id = getattr(settings, 'RAZORPAY_KEY_ID', '') or ''
    secret = getattr(settings, 'RAZORPAY_KEY_SECRET', '') or ''
    return bool(
        key_id
        and secret
        and not key_id.startswith('rzp_test_your_key')
        and secret != 'your_secret_here'
    )


def get_razorpay_client():
    """Returns a configured Razorpay client, or raises an error if not configured."""
    if not is_razorpay_configured():
        raise ValueError('Razorpay credentials are not configured. Set RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET in .env')
    import razorpay
    return razorpay.Client(auth=(settings.RAZORPAY_KEY_ID, settings.RAZORPAY_KEY_SECRET))


class CreateRazorpayOrderView(APIView):
    """
    POST /api/payments/create-order/
    Creates a Razorpay order for a given app order ID.
    The amount is fetched from the database – never trusted from the frontend.
    Returns: razorpay_order_id, amount, currency, key_id (public key only)
    """
    permission_classes = [IsAuthenticated]

    def post(self, request):
        serializer = CreateOrderSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        order_id = serializer.validated_data['order_id']

        # Ensure order belongs to this user
        try:
            order = Order.objects.get(id=order_id, user=request.user)
        except Order.DoesNotExist:
            return Response({'error': 'Order not found.'}, status=status.HTTP_404_NOT_FOUND)

        if order.payment_status == 'paid':
            return Response({'error': 'This order is already paid.'}, status=status.HTTP_400_BAD_REQUEST)

        # Amount in paise (Razorpay requires smallest currency unit)
        amount_in_paise = int(order.total_amount * 100)

        if not is_razorpay_configured():
            # ─────────────────────────────────────────────────────────────
            # DEV MODE ONLY: Return a mock Razorpay order for UI testing.
            # This does NOT represent a real payment and MUST NOT be used
            # in production. Real payments require valid Razorpay credentials.
            # ─────────────────────────────────────────────────────────────
            mock_razorpay_order_id = f'order_DEV_{order.id}_mock'
            Payment.objects.update_or_create(
                order=order,
                defaults={
                    'razorpay_order_id': mock_razorpay_order_id,
                    'amount': order.total_amount,
                    'currency': 'INR',
                    'status': 'created',
                }
            )
            order.razorpay_order_id = mock_razorpay_order_id
            order.save(update_fields=['razorpay_order_id'])
            return Response({
                'dev_mode': True,
                'message': 'DEV MODE: Razorpay not configured. This is a mock order.',
                'razorpay_order_id': mock_razorpay_order_id,
                'amount': amount_in_paise,
                'currency': 'INR',
                'key_id': 'NOT_CONFIGURED',
                'order_id': order.id,
            })

        # Production: Create real Razorpay order
        try:
            client = get_razorpay_client()
            razorpay_order = client.order.create({
                'amount': amount_in_paise,
                'currency': 'INR',
                'receipt': f'order_{order.id}',
                'payment_capture': 1,
            })
        except Exception as e:
            logger.error(f'Razorpay order creation failed: {e}')
            return Response(
                {'error': 'Payment gateway error. Please try again.'},
                status=status.HTTP_502_BAD_GATEWAY
            )

        # Save the Razorpay order ID
        Payment.objects.update_or_create(
            order=order,
            defaults={
                'razorpay_order_id': razorpay_order['id'],
                'amount': order.total_amount,
                'currency': 'INR',
                'status': 'created',
            }
        )
        order.razorpay_order_id = razorpay_order['id']
        order.save(update_fields=['razorpay_order_id'])

        return Response({
            'razorpay_order_id': razorpay_order['id'],
            'amount': amount_in_paise,
            'currency': 'INR',
            'key_id': settings.RAZORPAY_KEY_ID,  # Public key only – safe to send
            'order_id': order.id,
        })


class VerifyPaymentView(APIView):
    """
    POST /api/payments/verify/
    Verifies the Razorpay payment signature on the server side.
    Only marks the order as paid after successful HMAC-SHA256 verification.
    This is the only place where payment_status becomes 'paid'.
    """
    permission_classes = [IsAuthenticated]

    def post(self, request):
        serializer = VerifyPaymentSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        data = serializer.validated_data
        razorpay_order_id = data['razorpay_order_id']
        razorpay_payment_id = data['razorpay_payment_id']
        razorpay_signature = data['razorpay_signature']

        # Fetch the payment record
        try:
            payment = Payment.objects.select_related('order').get(
                razorpay_order_id=razorpay_order_id,
                order__user=request.user
            )
        except Payment.DoesNotExist:
            return Response({'error': 'Payment record not found.'}, status=status.HTTP_404_NOT_FOUND)

        if payment.status == 'paid':
            return Response({'message': 'Payment already verified.', 'order_id': payment.order.id})

        # DEV MODE: skip real verification if credentials not configured
        if not is_razorpay_configured():
            if razorpay_order_id.startswith('order_DEV_'):
                with transaction.atomic():
                    payment.razorpay_payment_id = razorpay_payment_id
                    payment.razorpay_signature = razorpay_signature
                    payment.status = 'paid'
                    payment.save()
                    payment.order.payment_status = 'paid'
                    payment.order.status = 'confirmed'
                    payment.order.save(update_fields=['payment_status', 'status'])
                return Response({
                    'dev_mode': True,
                    'message': 'DEV MODE: Payment marked as paid (no real verification).',
                    'order_id': payment.order.id,
                })
            return Response({'error': 'Razorpay not configured.'}, status=status.HTTP_400_BAD_REQUEST)

        # Production: Verify HMAC-SHA256 signature
        expected_signature = hmac.new(
            settings.RAZORPAY_KEY_SECRET.encode('utf-8'),
            f'{razorpay_order_id}|{razorpay_payment_id}'.encode('utf-8'),
            hashlib.sha256
        ).hexdigest()

        if not hmac.compare_digest(expected_signature, razorpay_signature):
            logger.warning(f'Invalid Razorpay signature for order {razorpay_order_id}')
            payment.status = 'failed'
            payment.save(update_fields=['status'])
            return Response({'error': 'Payment verification failed.'}, status=status.HTTP_400_BAD_REQUEST)

        # Signature valid – mark order as paid
        with transaction.atomic():
            payment.razorpay_payment_id = razorpay_payment_id
            payment.razorpay_signature = razorpay_signature
            payment.status = 'paid'
            payment.save()
            payment.order.payment_status = 'paid'
            payment.order.status = 'confirmed'
            payment.order.save(update_fields=['payment_status', 'status'])

        return Response({
            'message': 'Payment verified successfully.',
            'order_id': payment.order.id,
        })


class PaymentDetailView(APIView):
    """
    GET /api/payments/<order_id>/
    Returns payment info for a given order. User can only see their own.
    """
    permission_classes = [IsAuthenticated]

    def get(self, request, order_id):
        try:
            payment = Payment.objects.get(
                order__id=order_id,
                order__user=request.user
            )
        except Payment.DoesNotExist:
            return Response({'error': 'Payment not found.'}, status=status.HTTP_404_NOT_FOUND)
        return Response(PaymentSerializer(payment).data)
