import axiosClient from "./axiosClient";

const CouponAPI = {
  checkCoupon: async (query: string): Promise<any> => {
    const url = `/api/admin/coupon/promotion/checking${query}`;
    const res = await axiosClient.get(url);
    return res as any;
  },

  updateCoupon: async (id: string): Promise<any> => {
    const url = `/api/admin/coupon/promotion/${id}`;
    const res = await axiosClient.patch(url);
    return res as any;
  },

  getCoupons: async (query: string): Promise<any> => {
    const url = `/api/admin/coupon${query}`;
    const res = await axiosClient.get(url);
    return res as any;
  },

  getCoupon: async (id: string): Promise<any> => {
    const url = `/api/admin/coupon/${id}`;
    const res = await axiosClient.get(url);
    return res as any;
  },
};

export default CouponAPI;
