"""Admin configuration for payments app."""
from django.contrib import admin
from .models import Payment


@admin.register(Payment)
class PaymentAdmin(admin.ModelAdmin):
    list_display = (
        'id', 'order', 'razorpay_order_id', 'razorpay_payment_id',
        'amount', 'currency', 'status', 'created_at'
    )
    list_filter = ('status', 'currency')
    search_fields = ('razorpay_order_id', 'razorpay_payment_id', 'order__id')
    readonly_fields = ('order', 'razorpay_order_id', 'razorpay_payment_id',
                       'razorpay_signature', 'amount', 'currency', 'created_at', 'updated_at')
