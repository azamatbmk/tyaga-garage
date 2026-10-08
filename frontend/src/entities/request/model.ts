export type RequestItem = {
  id: number;
  title: string;
  location: string;
  category: string;
  start: number;
  end: number;
  urgent: boolean;
  branchId: string;
  creatorId: string;
  assigned?: string;
};

export function pendingRequests(requests: RequestItem[]) {
  return requests.filter((request) => !request.assigned);
}

export function requestsByCreator(requests: RequestItem[], creatorId: string) {
  return requests.filter((request) => request.creatorId === creatorId);
}

export function requestsByBranch(requests: RequestItem[], branchId: string) {
  return requests.filter((request) => request.branchId === branchId);
}
