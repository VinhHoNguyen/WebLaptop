import axiosClient from "./axiosClient";

const DetailOrderAPI = {
  post_detail_order: (data: Record<string, unknown>) => {
    const url = "/api/DetailOrder";
    return axiosClient.post(url, data);
  },

  get_detail_order: (id: string) => {
    const url = `/api/DetailOrder/${id}`;
    return axiosClient.get(url);
  },
};

export default DetailOrderAPI;
