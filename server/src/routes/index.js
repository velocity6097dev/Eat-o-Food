const express = require('express');
const router = express.Router();

const upload = require('../middleware/upload');
const { requireAdmin } = require('../middleware/auth');

const authCtrl = require('../controllers/auth.controller');
const shopCtrl = require('../controllers/shop.controller');
const tablesCtrl = require('../controllers/tables.controller');
const categoriesCtrl = require('../controllers/categories.controller');
const menuCtrl = require('../controllers/menu.controller');
const ordersCtrl = require('../controllers/orders.controller');
const paymentsCtrl = require('../controllers/payments.controller');
const promoCtrl = require('../controllers/promocodes.controller');

/* ---------- Public: shop info ---------- */
router.get('/shop', shopCtrl.getSettings);

/* ---------- Public: table + menu ---------- */
router.get('/tables/check/:tableNumber', tablesCtrl.checkTable);
router.get('/menu', menuCtrl.getPublicMenu);

/* ---------- Public: orders ---------- */
router.post('/orders', ordersCtrl.placeOrder);
router.get('/orders/track/:orderNumber', ordersCtrl.getOrderByNumber);

/* ---------- Public: promo codes ---------- */
router.post('/promocodes/check', promoCtrl.checkPromoCode);

/* ---------- Public: payments ---------- */
router.post('/payments/create-razorpay-order', paymentsCtrl.createRazorpayOrder);
router.post('/payments/verify', paymentsCtrl.verifyPayment);

/* ---------- Admin: auth ---------- */
router.post('/admin/login', authCtrl.login);
router.post('/admin/change-password', requireAdmin, authCtrl.changePassword);

/* ---------- Admin: shop settings ---------- */
router.put('/admin/shop', requireAdmin, shopCtrl.updateSettings);

/* ---------- Admin: tables ---------- */
router.get('/admin/tables', requireAdmin, tablesCtrl.listTables);
router.post('/admin/tables', requireAdmin, tablesCtrl.createTable);
router.put('/admin/tables/:id', requireAdmin, tablesCtrl.updateTable);
router.delete('/admin/tables/:id', requireAdmin, tablesCtrl.deleteTable);

/* ---------- Admin: categories ---------- */
router.get('/admin/categories', requireAdmin, categoriesCtrl.listCategories);
router.post('/admin/categories', requireAdmin, categoriesCtrl.createCategory);
router.put('/admin/categories/:id', requireAdmin, categoriesCtrl.updateCategory);
router.delete('/admin/categories/:id', requireAdmin, categoriesCtrl.deleteCategory);

/* ---------- Admin: menu items ---------- */
router.get('/admin/menu', requireAdmin, menuCtrl.listAllMenuItems);
router.post('/admin/menu', requireAdmin, upload.single('image'), menuCtrl.createMenuItem);
router.put('/admin/menu/:id', requireAdmin, upload.single('image'), menuCtrl.updateMenuItem);
router.patch('/admin/menu/:id/availability', requireAdmin, menuCtrl.setAvailability);
router.delete('/admin/menu/:id', requireAdmin, menuCtrl.deleteMenuItem);

/* ---------- Admin: orders / kitchen board ---------- */
router.get('/admin/orders/active', requireAdmin, ordersCtrl.listActiveOrders);
router.get('/admin/orders/history', requireAdmin, ordersCtrl.listAllOrders);
router.get('/admin/orders/counter/:code', requireAdmin, ordersCtrl.getOrderByCounterCode);
router.get('/admin/orders/:id', requireAdmin, ordersCtrl.getOrderById);
router.patch('/admin/orders/:id/status', requireAdmin, ordersCtrl.updateOrderStatus);
router.patch('/admin/orders/:id/payment', requireAdmin, ordersCtrl.updatePaymentStatus);

/* ---------- Admin: promo codes ---------- */
router.get('/admin/promocodes', requireAdmin, promoCtrl.listPromoCodes);
router.post('/admin/promocodes', requireAdmin, promoCtrl.createPromoCode);
router.put('/admin/promocodes/:id', requireAdmin, promoCtrl.updatePromoCode);
router.delete('/admin/promocodes/:id', requireAdmin, promoCtrl.deletePromoCode);

module.exports = router;
