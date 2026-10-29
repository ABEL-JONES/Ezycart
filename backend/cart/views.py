"""Views for the cart app."""
from rest_framework import status
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework.permissions import IsAuthenticated

from .models import Cart, CartItem
from .serializers import (
    CartSerializer,
    AddCartItemSerializer,
    UpdateCartItemSerializer,
)


def get_or_create_cart(user):
    """Helper: get or create a cart for the authenticated user."""
    cart, _ = Cart.objects.get_or_create(user=user)
    return cart


class CartView(APIView):
    """
    GET /api/cart/
    Returns the current user's cart with all items and total.
    """
    permission_classes = [IsAuthenticated]

    def get(self, request):
        cart = get_or_create_cart(request.user)
        serializer = CartSerializer(cart)
        return Response(serializer.data)


class CartItemAddView(APIView):
    """
    POST /api/cart/items/
    Add a product to the cart or increase its quantity if already present.
    """
    permission_classes = [IsAuthenticated]

    def post(self, request):
        serializer = AddCartItemSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        product = serializer.validated_data['product']
        quantity = serializer.validated_data['quantity']

        cart = get_or_create_cart(request.user)

        cart_item, created = CartItem.objects.get_or_create(
            cart=cart, product=product,
            defaults={'quantity': quantity}
        )
        if not created:
            new_qty = cart_item.quantity + quantity
            if new_qty > product.stock:
                return Response(
                    {'error': f'Only {product.stock} units available. You already have {cart_item.quantity} in cart.'},
                    status=status.HTTP_400_BAD_REQUEST
                )
            cart_item.quantity = new_qty
            cart_item.save()

        cart.refresh_from_db()
        return Response(CartSerializer(cart).data, status=status.HTTP_200_OK)


class CartItemUpdateView(APIView):
    """
    PATCH /api/cart/items/<id>/
    Update quantity of an existing cart item.
    DELETE /api/cart/items/<id>/
    Remove an item from the cart.
    """
    permission_classes = [IsAuthenticated]

    def get_item(self, item_id, user):
        try:
            return CartItem.objects.select_related('product', 'cart__user').get(
                id=item_id, cart__user=user
            )
        except CartItem.DoesNotExist:
            return None

    def patch(self, request, item_id):
        item = self.get_item(item_id, request.user)
        if not item:
            return Response({'error': 'Cart item not found.'}, status=status.HTTP_404_NOT_FOUND)

        serializer = UpdateCartItemSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        new_qty = serializer.validated_data['quantity']
        if new_qty > item.product.stock:
            return Response(
                {'error': f'Only {item.product.stock} units in stock.'},
                status=status.HTTP_400_BAD_REQUEST
            )

        item.quantity = new_qty
        item.save()

        cart = get_or_create_cart(request.user)
        return Response(CartSerializer(cart).data)

    def delete(self, request, item_id):
        item = self.get_item(item_id, request.user)
        if not item:
            return Response({'error': 'Cart item not found.'}, status=status.HTTP_404_NOT_FOUND)
        item.delete()
        cart = get_or_create_cart(request.user)
        return Response(CartSerializer(cart).data)
