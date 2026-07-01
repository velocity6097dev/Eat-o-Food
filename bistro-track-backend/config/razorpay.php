<?php
// ============================================================
// Razorpay keys — from https://dashboard.razorpay.com/app/keys
//
// KEY_ID is safe to expose to the frontend (it already is, in
// cart.html). KEY_SECRET must NEVER appear in any frontend file
// or be committed publicly — it only lives here, on the server.
// ============================================================

define('RAZORPAY_KEY_ID', 'rzp_test_T7PdP1tLIcDMHL'); // same test key currently in cart.html
define('RAZORPAY_KEY_SECRET', 'RC2JTKLCtTdf4ERswmu17RiV');
