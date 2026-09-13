export type RootStackParamList = {
  Login: undefined;
  Home: undefined;
  MyVehicles: undefined;
  CreateVehicle: undefined;
  ReceivedProposals: undefined;

  VehicleProposals: {
    vehicleId: string;
    vehicleTitle: string;
  };

  VehicleDetail: {
    vehicleId: string;
  };

  EditVehicle: {
    vehicleId: string;
  };
};
