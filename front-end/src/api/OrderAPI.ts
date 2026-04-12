import axiosClient from "./axiosClient";

const OrderAPI = {
  post_order: (data: Record<string, unknown>) => {
    const url = "/api/Payment/order";
    return axiosClient.post(url, data);
  },

  get_order: (id: string) => {
    const url = `/api/Payment/order/${id}`;
    return axiosClient.get(url);
  },

  get_detail: (id: string) => {
    const url = `/api/Payment/order/detail/${id}`;
    return axiosClient.get(url);
  },

  cancel_order: (query: string) => {
    const url = `/api/admin/Order/cancelorder${query}`;
    return axiosClient.patch(url);
  },
};

export default OrderAPI;
