export type RootStackParamList = {
  Login: undefined;
  Home: undefined;
  MyVehicles: undefined;
  CreateVehicle: undefined;

  ReceivedProposals: undefined;

  VehicleDetail: {
    vehicleId: string;
  };
  EditVehicle: {
    vehicleId: string;
  };
};
