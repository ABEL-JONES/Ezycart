"""URL patterns for the cart app."""
from django.urls import path
from .views import CartView, CartItemAddView, CartItemUpdateView

urlpatterns = [
    path('', CartView.as_view(), name='cart'),
    path('items/', CartItemAddView.as_view(), name='cart_item_add'),
    path('items/<int:item_id>/', CartItemUpdateView.as_view(), name='cart_item_update'),
]
