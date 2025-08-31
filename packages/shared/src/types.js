"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.WebhookEventType = exports.PaymentStatus = exports.PaymentIntentStatus = void 0;
var PaymentIntentStatus;
(function (PaymentIntentStatus) {
    PaymentIntentStatus["REQUIRES_PAYMENT"] = "requires_payment";
    PaymentIntentStatus["PROCESSING"] = "processing";
    PaymentIntentStatus["CONFIRMED"] = "confirmed";
    PaymentIntentStatus["FAILED"] = "failed";
    PaymentIntentStatus["EXPIRED"] = "expired";
})(PaymentIntentStatus || (exports.PaymentIntentStatus = PaymentIntentStatus = {}));
var PaymentStatus;
(function (PaymentStatus) {
    PaymentStatus["SEEN"] = "seen";
    PaymentStatus["CONFIRMED"] = "confirmed";
    PaymentStatus["REORGED"] = "reorged";
})(PaymentStatus || (exports.PaymentStatus = PaymentStatus = {}));
var WebhookEventType;
(function (WebhookEventType) {
    WebhookEventType["PAYMENT_INTENT_SUCCEEDED"] = "payment_intent.succeeded";
    WebhookEventType["PAYMENT_INTENT_FAILED"] = "payment_intent.failed";
    WebhookEventType["PAYMENT_INTENT_EXPIRED"] = "payment_intent.expired";
})(WebhookEventType || (exports.WebhookEventType = WebhookEventType = {}));
//# sourceMappingURL=types.js.map