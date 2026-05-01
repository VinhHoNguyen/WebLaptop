import axiosClient from "./axiosClient";

const DetailOrderAPI = {
  post_detail_order: async (data: Record<string, unknown>): Promise<any> => {
    const url = "/api/DetailOrder";
    const res = await axiosClient.post(url, data);
    return res as any;
  },

  get_detail_order: async (id: string): Promise<any> => {
    const url = `/api/DetailOrder/${id}`;
    const res = await axiosClient.get(url);
    return res as any;
  },
};

export default DetailOrderAPI;
