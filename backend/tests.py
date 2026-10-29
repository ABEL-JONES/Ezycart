"""
Comprehensive backend tests for EzyCart.
Tests cover: authentication, products, cart, orders, and payments.
Run with: python manage.py test
"""
from decimal import Decimal
from django.test import TestCase
from django.urls import reverse
from rest_framework.test import APIClient
from rest_framework import status

from accounts.models import User
from products.models import Category, Product
from cart.models import Cart, CartItem
from orders.models import Order, OrderItem
from payments.models import Payment


class BaseTestCase(TestCase):
    """Base test case with common setup."""

    def setUp(self):
        self.client = APIClient()

        # Create test user
        self.user = User.objects.create_user(
            email='testuser@example.com',
            username='testuser',
            full_name='Test User',
            password='TestPass123!'
        )

        # Create another user (to test isolation)
        self.other_user = User.objects.create_user(
            email='other@example.com',
            username='otheruser',
            full_name='Other User',
            password='TestPass123!'
        )

        # Create test category
        self.category = Category.objects.create(name='Electronics', slug='electronics')

        # Create test products
        self.product = Product.objects.create(
            category=self.category,
            name='Test Product',
            slug='test-product',
            price=Decimal('1000.00'),
            stock=10,
            is_active=True
        )
        self.discounted_product = Product.objects.create(
            category=self.category,
            name='Sale Product',
            slug='sale-product',
            price=Decimal('2000.00'),
            discount_price=Decimal('1500.00'),
            stock=5,
            is_active=True
        )
        self.out_of_stock_product = Product.objects.create(
            category=self.category,
            name='Out of Stock',
            slug='out-of-stock',
            price=Decimal('500.00'),
            stock=0,
            is_active=True
        )
        self.inactive_product = Product.objects.create(
            category=self.category,
            name='Inactive Product',
            slug='inactive-product',
            price=Decimal('300.00'),
            stock=5,
            is_active=False
        )

    def authenticate(self, user=None):
        """Authenticate the test client with JWT."""
        if user is None:
            user = self.user
        response = self.client.post(reverse('login'), {
            'email': user.email,
            'password': 'TestPass123!'
        }, format='json')
        token = response.data['access']
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {token}')
        return token


# ─────────────────────────────────────────────
# Authentication Tests
# ─────────────────────────────────────────────

class RegistrationTests(BaseTestCase):

    def test_register_success(self):
        """A new user can register successfully."""
        data = {
            'email': 'newuser@example.com',
            'username': 'newuser',
            'full_name': 'New User',
            'password': 'NewPass123!',
            'password_confirm': 'NewPass123!'
        }
        response = self.client.post(reverse('register'), data, format='json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertTrue(User.objects.filter(email='newuser@example.com').exists())

    def test_register_duplicate_email(self):
        """Registration fails if email is already taken."""
        data = {
            'email': 'testuser@example.com',
            'username': 'anotheruser',
            'full_name': 'Another',
            'password': 'Pass123!',
            'password_confirm': 'Pass123!'
        }
        response = self.client.post(reverse('register'), data, format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_register_passwords_dont_match(self):
        """Registration fails when passwords don't match."""
        data = {
            'email': 'someone@example.com',
            'username': 'someone',
            'full_name': 'Someone',
            'password': 'Pass123!',
            'password_confirm': 'WrongPass!'
        }
        response = self.client.post(reverse('register'), data, format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)


class LoginTests(BaseTestCase):

    def test_login_success(self):
        """User can log in and receive JWT tokens."""
        response = self.client.post(reverse('login'), {
            'email': 'testuser@example.com',
            'password': 'TestPass123!'
        }, format='json')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn('access', response.data)
        self.assertIn('refresh', response.data)
        self.assertIn('user', response.data)

    def test_login_wrong_password(self):
        """Login fails with incorrect password."""
        response = self.client.post(reverse('login'), {
            'email': 'testuser@example.com',
            'password': 'WrongPassword!'
        }, format='json')
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_unauthenticated_profile_access(self):
        """Unauthenticated users cannot access profile."""
        response = self.client.get(reverse('profile'))
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_authenticated_profile_access(self):
        """Authenticated users can access their profile."""
        self.authenticate()
        response = self.client.get(reverse('profile'))
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['email'], self.user.email)


# ─────────────────────────────────────────────
# Product Tests
# ─────────────────────────────────────────────

class ProductTests(BaseTestCase):

    def test_product_list_public(self):
        """Product list is accessible without authentication."""
        response = self.client.get(reverse('product_list'))
        self.assertEqual(response.status_code, status.HTTP_200_OK)

    def test_product_list_only_active(self):
        """Product list only shows active products."""
        response = self.client.get(reverse('product_list'))
        product_names = [p['name'] for p in response.data['results']]
        self.assertNotIn('Inactive Product', product_names)

    def test_product_search(self):
        """Products can be searched by name."""
        response = self.client.get(reverse('product_list'), {'search': 'Test Product'})
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertTrue(any('Test Product' in p['name'] for p in response.data['results']))

    def test_product_filter_by_category(self):
        """Products can be filtered by category slug."""
        response = self.client.get(reverse('product_list'), {'category': 'electronics'})
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertGreater(response.data['count'], 0)

    def test_product_detail_by_id(self):
        """Product detail view works with numeric ID."""
        response = self.client.get(reverse('product_detail', args=[self.product.id]))
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['name'], 'Test Product')

    def test_inactive_product_not_accessible(self):
        """Inactive products return 404 on detail view."""
        response = self.client.get(reverse('product_detail', args=[self.inactive_product.id]))
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)

    def test_discount_price_effective(self):
        """Discounted product returns discount_price as effective price."""
        response = self.client.get(reverse('product_detail', args=[self.discounted_product.id]))
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(
            Decimal(response.data['effective_price']),
            self.discounted_product.discount_price
        )


# ─────────────────────────────────────────────
# Cart Tests
# ─────────────────────────────────────────────

class CartTests(BaseTestCase):

    def setUp(self):
        super().setUp()
        self.authenticate()

    def test_get_empty_cart(self):
        """Authenticated user can get an empty cart."""
        response = self.client.get(reverse('cart'))
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['item_count'], 0)

    def test_add_to_cart(self):
        """User can add a product to the cart."""
        response = self.client.post(reverse('cart_item_add'), {
            'product_id': self.product.id,
            'quantity': 2
        }, format='json')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['item_count'], 2)

    def test_add_to_cart_exceeds_stock(self):
        """Cannot add more than available stock."""
        response = self.client.post(reverse('cart_item_add'), {
            'product_id': self.product.id,
            'quantity': 999
        }, format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_add_inactive_product_to_cart(self):
        """Cannot add an inactive product to the cart."""
        response = self.client.post(reverse('cart_item_add'), {
            'product_id': self.inactive_product.id,
            'quantity': 1
        }, format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_cart_total_uses_server_price(self):
        """Cart total is calculated from database prices, not frontend input."""
        self.client.post(reverse('cart_item_add'), {
            'product_id': self.discounted_product.id,
            'quantity': 1
        }, format='json')
        response = self.client.get(reverse('cart'))
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        # Total should use effective_price (discount_price) from the database
        expected_total = str(self.discounted_product.effective_price)
        self.assertEqual(response.data['total'], expected_total)

    def test_update_cart_item(self):
        """User can update the quantity of a cart item."""
        add_response = self.client.post(reverse('cart_item_add'), {
            'product_id': self.product.id,
            'quantity': 1
        }, format='json')
        item_id = add_response.data['items'][0]['id']
        update_response = self.client.patch(
            reverse('cart_item_update', args=[item_id]),
            {'quantity': 3},
            format='json'
        )
        self.assertEqual(update_response.status_code, status.HTTP_200_OK)
        self.assertEqual(update_response.data['item_count'], 3)

    def test_remove_cart_item(self):
        """User can remove an item from the cart."""
        add_response = self.client.post(reverse('cart_item_add'), {
            'product_id': self.product.id,
            'quantity': 1
        }, format='json')
        item_id = add_response.data['items'][0]['id']
        delete_response = self.client.delete(
            reverse('cart_item_update', args=[item_id])
        )
        self.assertEqual(delete_response.status_code, status.HTTP_200_OK)
        self.assertEqual(delete_response.data['item_count'], 0)

    def test_cannot_access_other_users_cart_item(self):
        """User cannot modify another user's cart items."""
        # Add item to user's cart
        add_response = self.client.post(reverse('cart_item_add'), {
            'product_id': self.product.id,
            'quantity': 1
        }, format='json')
        item_id = add_response.data['items'][0]['id']

        # Switch to other user
        self.authenticate(self.other_user)
        response = self.client.patch(
            reverse('cart_item_update', args=[item_id]),
            {'quantity': 5},
            format='json'
        )
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)


# ─────────────────────────────────────────────
# Order Tests
# ─────────────────────────────────────────────

CHECKOUT_DATA = {
    'full_name': 'Test User',
    'phone': '9876543210',
    'address_line1': '123 Test Street',
    'city': 'Mumbai',
    'state': 'Maharashtra',
    'postal_code': '400001',
    'payment_method': 'razorpay'
}


class OrderTests(BaseTestCase):

    def setUp(self):
        super().setUp()
        self.authenticate()
        # Add product to cart
        self.client.post(reverse('cart_item_add'), {
            'product_id': self.product.id,
            'quantity': 2
        }, format='json')

    def test_checkout_success(self):
        """Checkout creates an order and reduces stock."""
        initial_stock = self.product.stock
        response = self.client.post(reverse('checkout'), CHECKOUT_DATA, format='json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(response.data['order']['status'], 'pending')
        self.assertEqual(response.data['order']['payment_status'], 'unpaid')
        # Stock should be reduced
        self.product.refresh_from_db()
        self.assertEqual(self.product.stock, initial_stock - 2)

    def test_checkout_clears_cart(self):
        """Cart is cleared after successful checkout."""
        self.client.post(reverse('checkout'), CHECKOUT_DATA, format='json')
        cart_response = self.client.get(reverse('cart'))
        self.assertEqual(cart_response.data['item_count'], 0)

    def test_checkout_empty_cart(self):
        """Checkout fails when cart is empty."""
        # Remove all items first
        cart = Cart.objects.get(user=self.user)
        cart.items.all().delete()
        response = self.client.post(reverse('checkout'), CHECKOUT_DATA, format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_checkout_validates_delivery_details(self):
        """Checkout fails when required delivery fields are missing."""
        response = self.client.post(reverse('checkout'), {
            'full_name': '',
            'city': 'Mumbai'
        }, format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_order_list_shows_only_own_orders(self):
        """Users can only see their own orders."""
        self.client.post(reverse('checkout'), CHECKOUT_DATA, format='json')
        response = self.client.get(reverse('order_list'))
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        for order in response.data['results']:
            self.assertNotIn('user', order)  # Lightweight serializer

    def test_order_detail_forbidden_for_other_user(self):
        """User cannot access another user's order details."""
        checkout_response = self.client.post(reverse('checkout'), CHECKOUT_DATA, format='json')
        order_id = checkout_response.data['order']['id']

        # Switch to other user
        self.authenticate(self.other_user)
        response = self.client.get(reverse('order_detail', args=[order_id]))
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)

    def test_unauthenticated_checkout_rejected(self):
        """Unauthenticated users cannot checkout."""
        self.client.credentials()
        response = self.client.post(reverse('checkout'), CHECKOUT_DATA, format='json')
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)


# ─────────────────────────────────────────────
# Payment Tests
# ─────────────────────────────────────────────

class PaymentTests(BaseTestCase):

    def setUp(self):
        super().setUp()
        self.authenticate()
        # Setup: add to cart and checkout
        self.client.post(reverse('cart_item_add'), {
            'product_id': self.product.id,
            'quantity': 1
        }, format='json')
        checkout_response = self.client.post(reverse('checkout'), CHECKOUT_DATA, format='json')
        self.order_id = checkout_response.data['order']['id']

    def test_create_payment_order(self):
        """Can create a payment order for an existing order."""
        response = self.client.post(reverse('create_payment_order'), {
            'order_id': self.order_id
        }, format='json')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn('razorpay_order_id', response.data)

    def test_cannot_create_payment_for_other_users_order(self):
        """User cannot create a payment order for another user's order."""
        self.authenticate(self.other_user)
        response = self.client.post(reverse('create_payment_order'), {
            'order_id': self.order_id
        }, format='json')
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)
