// Re-export all individual APIs for direct import
export * from './adminBrand.api';
export * from './adminCategory.api';
export * from './adminCoupon.api';
export * from './adminDashboard.api';
export * from './adminOrder.api';
export * from './adminPayment.api';
export * from './adminProduct.api';
export * from './adminReview.api';
export * from './adminUpload.api';
export * from './adminUser.api';

// Namespaced API objects to avoid any name collision with client/shop APIs
import * as brandApi from './adminBrand.api';
import * as categoryApi from './adminCategory.api';
import * as couponApi from './adminCoupon.api';
import * as dashboardApi from './adminDashboard.api';
import * as orderApi from './adminOrder.api';
import * as paymentApi from './adminPayment.api';
import * as productApi from './adminProduct.api';
import * as reviewApi from './adminReview.api';
import * as uploadApi from './adminUpload.api';
import * as userApi from './adminUser.api';

export const adminBrandApi = brandApi;
export const adminCategoryApi = categoryApi;
export const adminCouponApi = couponApi;
export const adminDashboardApi = dashboardApi;
export const adminOrderApi = orderApi;
export const adminPaymentApi = paymentApi;
export const adminProductApi = productApi;
export const adminReviewApi = reviewApi;
export const adminUploadApi = uploadApi;
export const adminUserApi = userApi;
