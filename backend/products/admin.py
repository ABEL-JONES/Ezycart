"""Admin configuration for products app."""
from django.contrib import admin
from .models import Category, Product


@admin.register(Category)
class CategoryAdmin(admin.ModelAdmin):
    list_display = ('name', 'slug', 'created_at')
    search_fields = ('name',)
    prepopulated_fields = {'slug': ('name',)}


@admin.register(Product)
class ProductAdmin(admin.ModelAdmin):
    list_display = (
        'name', 'category', 'price', 'discount_price', 'stock', 'is_active', 'created_at'
    )
    list_filter = ('is_active', 'category')
    search_fields = ('name', 'description')
    list_editable = ('price', 'discount_price', 'stock', 'is_active')
    prepopulated_fields = {'slug': ('name',)}
    readonly_fields = ('created_at', 'updated_at')
    fieldsets = (
        ('Basic Info', {'fields': ('name', 'slug', 'category', 'description', 'image')}),
        ('Pricing', {'fields': ('price', 'discount_price')}),
        ('Inventory', {'fields': ('stock', 'is_active')}),
        ('Timestamps', {'fields': ('created_at', 'updated_at')}),
    )
