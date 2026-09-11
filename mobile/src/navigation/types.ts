export type RootStackParamList = {
  Login: undefined;
  Home: undefined;
  MyVehicles: undefined;
  CreateVehicle: undefined;

  VehicleDetail: {
    vehicleId: string;
  };
  EditVehicle: {
    vehicleId: string;
  };
};
