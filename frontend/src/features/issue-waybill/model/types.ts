export type WaybillFormValues = {
  requestId: number;
  validFrom: string;
  validTo: string;
  odometerStart: string;
  odometerEnd: string;
  messageKind: "городское" | "пригородное" | "междугородное";
};
