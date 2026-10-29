"""URL patterns for the payments app."""
from django.urls import path
from .views import CreateRazorpayOrderView, VerifyPaymentView, PaymentDetailView

urlpatterns = [
    path('create-order/', CreateRazorpayOrderView.as_view(), name='create_payment_order'),
    path('verify/', VerifyPaymentView.as_view(), name='verify_payment'),
    path('<int:order_id>/', PaymentDetailView.as_view(), name='payment_detail'),
]
