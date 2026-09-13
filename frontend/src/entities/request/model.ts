export type RequestItem = {
  id: number;
  title: string;
  location: string;
  category: string;
  start: number;
  end: number;
  urgent: boolean;
  assigned?: string;
};

export function pendingRequests(requests: RequestItem[]) {
  return requests.filter((request) => !request.assigned);
}
