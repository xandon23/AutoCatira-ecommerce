export type RootStackParamList = {
  Login: undefined;
  Home: undefined;
  Register: undefined;
  MyVehicles: undefined;
  CreateVehicle: undefined;
  ReceivedProposals: undefined;
  Negotiations: undefined;
  Admin: undefined;

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

  NegotiationDetail: {
    proposalId: string;
  };
};
