"""Serializers for the payments app."""
from rest_framework import serializers
from .models import Payment


class PaymentSerializer(serializers.ModelSerializer):
    class Meta:
        model = Payment
        fields = (
            'id', 'order', 'razorpay_order_id', 'razorpay_payment_id',
            'amount', 'currency', 'status', 'created_at',
        )
        read_only_fields = fields


class CreateOrderSerializer(serializers.Serializer):
    """Used to initiate a Razorpay order for a given app order."""
    order_id = serializers.IntegerField()


class VerifyPaymentSerializer(serializers.Serializer):
    """
    Used to verify a Razorpay payment on the backend.
    All three IDs are required for HMAC-SHA256 signature verification.
    """
    razorpay_order_id = serializers.CharField()
    razorpay_payment_id = serializers.CharField()
    razorpay_signature = serializers.CharField()
