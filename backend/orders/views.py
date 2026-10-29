"""Views for the orders app."""
from django.db import transaction
from rest_framework import status, generics
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework.permissions import IsAuthenticated

from cart.models import Cart
from .models import Order, OrderItem
from .serializers import CheckoutSerializer, OrderSerializer, OrderListSerializer


DELIVERY_CHARGE = 0  # Free delivery (change as needed)


class CheckoutView(APIView):
    """
    POST /api/orders/checkout/
    Creates an order from the user's cart.
    - Validates delivery details
    - Re-checks stock and prices from the database (never trusts frontend amounts)
    - Creates order and order items atomically
    - Reduces stock
    - Clears the cart
    """
    permission_classes = [IsAuthenticated]

    def post(self, request):
        # Validate delivery details
        serializer = CheckoutSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        data = serializer.validated_data

        # Get the user's cart
        try:
            cart = Cart.objects.prefetch_related('items__product').get(user=request.user)
        except Cart.DoesNotExist:
            return Response({'error': 'Your cart is empty.'}, status=status.HTTP_400_BAD_REQUEST)

        cart_items = cart.items.all()
        if not cart_items.exists():
            return Response({'error': 'Your cart is empty.'}, status=status.HTTP_400_BAD_REQUEST)

        # Re-validate stock and prices from the database
        errors = []
        for item in cart_items:
            product = item.product
            if not product.is_active:
                errors.append(f"'{product.name}' is no longer available.")
            elif item.quantity > product.stock:
                errors.append(
                    f"Only {product.stock} units of '{product.name}' are in stock."
                )

        if errors:
            return Response({'errors': errors}, status=status.HTTP_400_BAD_REQUEST)

        # Calculate total from the database (never trust frontend)
        subtotal = sum(item.product.effective_price * item.quantity for item in cart_items)
        total_amount = subtotal + DELIVERY_CHARGE

        # Create order and items atomically
        with transaction.atomic():
            order = Order.objects.create(
                user=request.user,
                full_name=data['full_name'],
                phone=data['phone'],
                address_line1=data['address_line1'],
                address_line2=data.get('address_line2', ''),
                city=data['city'],
                state=data['state'],
                postal_code=data['postal_code'],
                notes=data.get('notes', ''),
                total_amount=total_amount,
                delivery_charge=DELIVERY_CHARGE,
                payment_method=data['payment_method'],
                status='pending',
                payment_status='unpaid',
            )

            for item in cart_items:
                product = item.product
                OrderItem.objects.create(
                    order=order,
                    product=product,
                    product_name=product.name,
                    unit_price=product.effective_price,
                    quantity=item.quantity,
                    subtotal=product.effective_price * item.quantity,
                )
                # Reduce stock immediately (for COD) or after payment (for Razorpay)
                # We reserve stock here; Razorpay verification will confirm payment
                product.stock -= item.quantity
                product.save(update_fields=['stock'])

            # Clear the cart
            cart.items.all().delete()

        return Response(
            {
                'message': 'Order placed successfully.',
                'order': OrderSerializer(order).data,
            },
            status=status.HTTP_201_CREATED
        )


class OrderListView(generics.ListAPIView):
    """
    GET /api/orders/
    Returns all orders for the authenticated user.
    """
    serializer_class = OrderListSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return Order.objects.filter(user=self.request.user).prefetch_related('items')


class OrderDetailView(generics.RetrieveAPIView):
    """
    GET /api/orders/<id>/
    Returns full details of a specific order.
    Users can only see their own orders.
    """
    serializer_class = OrderSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return Order.objects.filter(user=self.request.user).prefetch_related('items')
