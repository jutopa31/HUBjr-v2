export type Patient = {
  id: string;
  name: string;
  mrn: string;
  age: number;
  service: string;
  status: "active" | "discharged" | "archived";
};