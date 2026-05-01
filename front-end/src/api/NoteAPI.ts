import axiosClient from "./axiosClient";

const NoteAPI = {
  post_note: async (data: Record<string, unknown>): Promise<any> => {
    const url = "/api/Note";
    const res = await axiosClient.post(url, data);
    return res as any;
  },

  get_note: async (id: string): Promise<any> => {
    const url = `/api/Note/${id}`;
    const res = await axiosClient.get(url);
    return res as any;
  },
};

export default NoteAPI;
