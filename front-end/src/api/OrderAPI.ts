import axiosClient from "./axiosClient";

const OrderAPI = {
  post_order: async (data: Record<string, unknown>): Promise<any> => {
    const url = "/api/Payment/order";
    const res = await axiosClient.post(url, data);
    return res as any;
  },

  get_order: async (id: string): Promise<any> => {
    const url = `/api/Payment/order/${id}`;
    const res = await axiosClient.get(url);
    return res as any;
  },

  get_detail: async (id: string): Promise<any> => {
    const url = `/api/Payment/order/detail/${id}`;
    const res = await axiosClient.get(url);
    return res as any;
  },

  post_email: async (data: Record<string, unknown>): Promise<any> => {
    const url = "/api/Payment/email";
    const res = await axiosClient.post(url, data);
    return res as any;
  },

  cancel_order: async (query: string): Promise<any> => {
    const url = `/api/admin/Order/cancelorder${query}`;
    const res = await axiosClient.patch(url);
    return res as any;
  },

  cancel_order_user: async (orderId: string): Promise<any> => {
    const url = `/api/Payment/orders/${orderId}/status`;
    const res = await axiosClient.patch(url, { status: "Cancelled" });
    return res as any;
  },
};

export default OrderAPI;
