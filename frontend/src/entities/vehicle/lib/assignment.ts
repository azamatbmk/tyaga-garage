export type VehicleAssignment = {
  title: string;
  location: string;
};

type AssignmentJob = {
  vehicle: string;
  title: string;
  location: string;
};

type AssignmentRequest = {
  assigned?: string;
  title: string;
  location: string;
};

/** Карта назначений: техника → заявка/работа (куда едет) */
export function buildVehicleAssignments(
  vehicleIds: string[],
  jobs: AssignmentJob[],
  requests: AssignmentRequest[],
): Record<string, VehicleAssignment | null> {
  const map: Record<string, VehicleAssignment | null> = {};
  for (const id of vehicleIds) {
    const job = jobs.find((item) => item.vehicle === id);
    if (job) {
      map[id] = { title: job.title, location: job.location };
      continue;
    }
    const request = requests.find((item) => item.assigned === id);
    map[id] = request
      ? { title: request.title, location: request.location }
      : null;
  }
  return map;
}
