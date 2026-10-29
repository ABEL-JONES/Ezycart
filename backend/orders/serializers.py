"""Serializers for the orders app."""
from rest_framework import serializers
from .models import Order, OrderItem


class OrderItemSerializer(serializers.ModelSerializer):
    class Meta:
        model = OrderItem
        fields = ('id', 'product', 'product_name', 'unit_price', 'quantity', 'subtotal')


class CheckoutSerializer(serializers.Serializer):
    """
    Validates delivery details submitted during checkout.
    Prices and totals are NEVER trusted from the frontend.
    """
    full_name = serializers.CharField(max_length=150)
    phone = serializers.CharField(max_length=15)
    address_line1 = serializers.CharField(max_length=255)
    address_line2 = serializers.CharField(max_length=255, required=False, allow_blank=True)
    city = serializers.CharField(max_length=100)
    state = serializers.CharField(max_length=100)
    postal_code = serializers.CharField(max_length=10)
    notes = serializers.CharField(required=False, allow_blank=True)
    payment_method = serializers.ChoiceField(
        choices=[('razorpay', 'Razorpay'), ('cod', 'Cash on Delivery')],
        default='razorpay'
    )


class OrderSerializer(serializers.ModelSerializer):
    items = OrderItemSerializer(many=True, read_only=True)

    class Meta:
        model = Order
        fields = (
            'id', 'user', 'full_name', 'phone',
            'address_line1', 'address_line2', 'city', 'state', 'postal_code', 'notes',
            'total_amount', 'delivery_charge', 'status', 'payment_status', 'payment_method',
            'razorpay_order_id', 'items', 'created_at', 'updated_at',
        )
        read_only_fields = ('id', 'user', 'created_at', 'updated_at', 'razorpay_order_id')


class OrderListSerializer(serializers.ModelSerializer):
    """Lightweight serializer for order listing."""
    item_count = serializers.SerializerMethodField()

    class Meta:
        model = Order
        fields = (
            'id', 'full_name', 'total_amount', 'delivery_charge',
            'status', 'payment_status', 'payment_method',
            'item_count', 'created_at',
        )

    def get_item_count(self, obj):
        return sum(item.quantity for item in obj.items.all())
