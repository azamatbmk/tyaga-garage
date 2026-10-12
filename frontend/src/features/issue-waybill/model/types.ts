export type WaybillFormValues = {
  vehicleId: string;
  validFrom: string;
  validTo: string;
  odometerStart: string;
  odometerEnd: string;
  messageKind: "городское" | "пригородное" | "междугородное";
};
