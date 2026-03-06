import Map "mo:core/Map";
import Nat "mo:core/Nat";
import Array "mo:core/Array";
import Text "mo:core/Text";
import List "mo:core/List";
import Principal "mo:core/Principal";
import Runtime "mo:core/Runtime";
import MixinAuthorization "authorization/MixinAuthorization";
import AccessControl "authorization/access-control";

actor {
  type Service = {
    id : Nat;
    name : Text;
    category : ServiceCategory;
    price : Nat;
    durationMinutes : Nat;
    description : Text;
    imageUrl : Text;
    isActive : Bool;
  };

  type ServiceCategory = {
    #hair;
    #makeup;
    #facial;
    #nails;
    #bridal;
  };

  type Appointment = {
    id : Nat;
    userId : Principal;
    serviceId : Nat;
    date : Text;
    timeSlot : Text;
    notes : Text;
    status : AppointmentStatus;
  };

  type AppointmentStatus = {
    #pending;
    #confirmed;
    #completed;
    #cancelled;
  };

  type Payment = {
    id : Nat;
    appointmentId : Nat;
    amount : Nat;
    status : PaymentStatus;
  };

  type PaymentStatus = {
    #pending;
    #completed;
    #failed;
  };

  type UserRole = {
    #admin;
    #user;
  };

  type UserProfile = {
    id : Principal;
    name : Text;
    phone : Text;
    email : Text;
    role : UserRole;
  };

  type AdminStats = {
    totalBookings : Nat;
    totalRevenue : Nat;
    pendingCount : Nat;
    confirmedCount : Nat;
    completedCount : Nat;
    cancelledCount : Nat;
  };

  var nextServiceId = 1;
  var nextAppointmentId = 1;
  var nextPaymentId = 1;

  let services = Map.empty<Nat, Service>();
  let appointments = Map.empty<Nat, Appointment>();
  let payments = Map.empty<Nat, Payment>();
  let userProfiles = Map.empty<Principal, UserProfile>();

  // Authorization
  let accessControlState = AccessControl.initState();
  include MixinAuthorization(accessControlState);

  // Pre-seed services
  private func seedServices() {
    let seedData : [Service] = [
      {
        id = 1;
        name = "Haircut";
        category = #hair;
        price = 2500;
        durationMinutes = 45;
        description = "Professional haircut service";
        imageUrl = "";
        isActive = true;
      },
      {
        id = 2;
        name = "Hair Spa";
        category = #hair;
        price = 4500;
        durationMinutes = 60;
        description = "Relaxing hair spa treatment";
        imageUrl = "";
        isActive = true;
      },
      {
        id = 3;
        name = "Facial";
        category = #facial;
        price = 3500;
        durationMinutes = 60;
        description = "Rejuvenating facial treatment";
        imageUrl = "";
        isActive = true;
      },
      {
        id = 4;
        name = "Party Makeup";
        category = #makeup;
        price = 6000;
        durationMinutes = 90;
        description = "Glamorous party makeup";
        imageUrl = "";
        isActive = true;
      },
      {
        id = 5;
        name = "Bridal Makeup";
        category = #bridal;
        price = 15000;
        durationMinutes = 180;
        description = "Complete bridal makeup package";
        imageUrl = "";
        isActive = true;
      },
      {
        id = 6;
        name = "Nail Art";
        category = #nails;
        price = 1500;
        durationMinutes = 45;
        description = "Creative nail art designs";
        imageUrl = "";
        isActive = true;
      },
    ];

    for (service in seedData.values()) {
      services.add(service.id, service);
      if (service.id >= nextServiceId) {
        nextServiceId := service.id + 1;
      };
    };
  };

  // Initialize with seed data
  seedServices();

  // Services - Admin can create/update/delete, anyone can list/get
  public shared ({ caller }) func createService(
    name : Text,
    category : ServiceCategory,
    price : Nat,
    durationMinutes : Nat,
    description : Text,
    imageUrl : Text,
    isActive : Bool
  ) : async Nat {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Runtime.trap("Unauthorized: Only admins can create services");
    };

    let serviceId = nextServiceId;
    let newService : Service = {
      id = serviceId;
      name = name;
      category = category;
      price = price;
      durationMinutes = durationMinutes;
      description = description;
      imageUrl = imageUrl;
      isActive = isActive;
    };

    services.add(serviceId, newService);
    nextServiceId += 1;
    serviceId;
  };

  public shared ({ caller }) func updateService(
    serviceId : Nat,
    name : Text,
    category : ServiceCategory,
    price : Nat,
    durationMinutes : Nat,
    description : Text,
    imageUrl : Text,
    isActive : Bool
  ) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Runtime.trap("Unauthorized: Only admins can update services");
    };

    switch (services.get(serviceId)) {
      case (null) { Runtime.trap("Service not found") };
      case (?_) {
        let updatedService : Service = {
          id = serviceId;
          name = name;
          category = category;
          price = price;
          durationMinutes = durationMinutes;
          description = description;
          imageUrl = imageUrl;
          isActive = isActive;
        };
        services.add(serviceId, updatedService);
      };
    };
  };

  public shared ({ caller }) func deleteService(serviceId : Nat) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Runtime.trap("Unauthorized: Only admins can delete services");
    };

    switch (services.get(serviceId)) {
      case (null) { Runtime.trap("Service not found") };
      case (?_) {
        services.remove(serviceId);
      };
    };
  };

  public query func getService(serviceId : Nat) : async ?Service {
    services.get(serviceId);
  };

  public query func listServices() : async [Service] {
    Array.fromIter(services.values());
  };

  // Appointments - Users can create their own, list their own; Admin can list all and update status
  public shared ({ caller }) func createAppointment(
    serviceId : Nat,
    date : Text,
    timeSlot : Text,
    notes : Text
  ) : async Nat {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can create appointments");
    };

    // Verify service exists
    switch (services.get(serviceId)) {
      case (null) { Runtime.trap("Service not found") };
      case (?_) {};
    };

    let appointmentId = nextAppointmentId;
    let newAppointment : Appointment = {
      id = appointmentId;
      userId = caller;
      serviceId = serviceId;
      date = date;
      timeSlot = timeSlot;
      notes = notes;
      status = #pending;
    };

    appointments.add(appointmentId, newAppointment);
    nextAppointmentId += 1;
    appointmentId;
  };

  public query ({ caller }) func getAppointment(appointmentId : Nat) : async ?Appointment {
    switch (appointments.get(appointmentId)) {
      case (null) { null };
      case (?appointment) {
        // Users can only view their own appointments, admins can view all
        if (appointment.userId == caller or AccessControl.isAdmin(accessControlState, caller)) {
          ?appointment;
        } else {
          Runtime.trap("Unauthorized: Can only view your own appointments");
        };
      };
    };
  };

  public query ({ caller }) func listMyAppointments() : async [Appointment] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can list appointments");
    };

    let userAppointments = List.empty<Appointment>();
    for (appointment in appointments.values()) {
      if (appointment.userId == caller) {
        userAppointments.add(appointment);
      };
    };
    Array.fromIter(userAppointments.values());
  };

  public query ({ caller }) func listAllAppointments() : async [Appointment] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Runtime.trap("Unauthorized: Only admins can list all appointments");
    };

    Array.fromIter(appointments.values());
  };

  public shared ({ caller }) func updateAppointmentStatus(
    appointmentId : Nat,
    status : AppointmentStatus
  ) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Runtime.trap("Unauthorized: Only admins can update appointment status");
    };

    switch (appointments.get(appointmentId)) {
      case (null) { Runtime.trap("Appointment not found") };
      case (?appointment) {
        let updatedAppointment : Appointment = {
          appointment with
          status = status;
        };
        appointments.add(appointmentId, updatedAppointment);
      };
    };
  };

  public query func getAvailableTimeSlots(date : Text) : async [Text] {
    // Get all booked slots for the given date
    let bookedSlots = List.empty<Text>();
    for (appointment in appointments.values()) {
      if (appointment.date == date and (appointment.status == #pending or appointment.status == #confirmed)) {
        bookedSlots.add(appointment.timeSlot);
      };
    };

    // Generate all possible slots (9:00 to 18:00, every 30 minutes)
    let allSlots = List.empty<Text>();
    var hour = 9;
    while (hour < 18) {
      let hourStr = if (hour < 10) { "0" # hour.toText() } else { hour.toText() };
      allSlots.add(hourStr # ":00");
      allSlots.add(hourStr # ":30");
      hour += 1;
    };
    allSlots.add("18:00");

    // Filter out booked slots
    let availableSlots = List.empty<Text>();
    for (slot in allSlots.values()) {
      var isBooked = false;
      for (bookedSlot in bookedSlots.values()) {
        if (slot == bookedSlot) {
          isBooked := true;
        };
      };
      if (not isBooked) {
        availableSlots.add(slot);
      };
    };

    Array.fromIter(availableSlots.values());
  };

  // Payments - Users can create for their appointments, view their own; Admin can view all
  public shared ({ caller }) func createPayment(
    appointmentId : Nat,
    amount : Nat
  ) : async Nat {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can create payments");
    };

    // Verify appointment exists and belongs to caller
    switch (appointments.get(appointmentId)) {
      case (null) { Runtime.trap("Appointment not found") };
      case (?appointment) {
        if (appointment.userId != caller) {
          Runtime.trap("Unauthorized: Can only create payment for your own appointment");
        };
      };
    };

    let paymentId = nextPaymentId;
    let newPayment : Payment = {
      id = paymentId;
      appointmentId = appointmentId;
      amount = amount;
      status = #pending;
    };

    payments.add(paymentId, newPayment);
    nextPaymentId += 1;
    paymentId;
  };

  public shared ({ caller }) func completePayment(paymentId : Nat) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can complete payments");
    };

    switch (payments.get(paymentId)) {
      case (null) { Runtime.trap("Payment not found") };
      case (?payment) {
        // Verify the payment's appointment belongs to the caller
        switch (appointments.get(payment.appointmentId)) {
          case (null) { Runtime.trap("Associated appointment not found") };
          case (?appointment) {
            if (appointment.userId != caller and not AccessControl.isAdmin(accessControlState, caller)) {
              Runtime.trap("Unauthorized: Can only complete your own payments");
            };

            let updatedPayment : Payment = {
              payment with
              status = #completed;
            };
            payments.add(paymentId, updatedPayment);
          };
        };
      };
    };
  };

  public query ({ caller }) func getPaymentByAppointment(appointmentId : Nat) : async ?Payment {
    // Verify appointment ownership
    switch (appointments.get(appointmentId)) {
      case (null) { Runtime.trap("Appointment not found") };
      case (?appointment) {
        if (appointment.userId != caller and not AccessControl.isAdmin(accessControlState, caller)) {
          Runtime.trap("Unauthorized: Can only view payments for your own appointments");
        };

        // Find payment for this appointment
        for (payment in payments.values()) {
          if (payment.appointmentId == appointmentId) {
            return ?payment;
          };
        };
        null;
      };
    };
  };

  public query ({ caller }) func getPayment(paymentId : Nat) : async ?Payment {
    switch (payments.get(paymentId)) {
      case (null) { null };
      case (?payment) {
        // Verify ownership through appointment
        switch (appointments.get(payment.appointmentId)) {
          case (null) { Runtime.trap("Associated appointment not found") };
          case (?appointment) {
            if (appointment.userId == caller or AccessControl.isAdmin(accessControlState, caller)) {
              ?payment;
            } else {
              Runtime.trap("Unauthorized: Can only view your own payments");
            };
          };
        };
      };
    };
  };

  // Admin Stats - Admin only
  public query ({ caller }) func getAdminStats() : async AdminStats {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Runtime.trap("Unauthorized: Only admins can view statistics");
    };

    var totalBookings = 0;
    var totalRevenue = 0;
    var pendingCount = 0;
    var confirmedCount = 0;
    var completedCount = 0;
    var cancelledCount = 0;

    for (appointment in appointments.values()) {
      totalBookings += 1;
      switch (appointment.status) {
        case (#pending) { pendingCount += 1 };
        case (#confirmed) { confirmedCount += 1 };
        case (#completed) { completedCount += 1 };
        case (#cancelled) { cancelledCount += 1 };
      };
    };

    for (payment in payments.values()) {
      if (payment.status == #completed) {
        totalRevenue += payment.amount;
      };
    };

    {
      totalBookings = totalBookings;
      totalRevenue = totalRevenue;
      pendingCount = pendingCount;
      confirmedCount = confirmedCount;
      completedCount = completedCount;
      cancelledCount = cancelledCount;
    };
  };

  // User Profile - Users can view/update their own, admins can view any
  public query ({ caller }) func getCallerUserProfile() : async ?UserProfile {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can view profiles");
    };
    userProfiles.get(caller);
  };

  public query ({ caller }) func getUserProfile(user : Principal) : async ?UserProfile {
    if (caller != user and not AccessControl.isAdmin(accessControlState, caller)) {
      Runtime.trap("Unauthorized: Can only view your own profile");
    };
    userProfiles.get(user);
  };

  public shared ({ caller }) func saveCallerUserProfile(
    name : Text,
    phone : Text,
    email : Text
  ) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can save profiles");
    };

    let role : UserRole = if (AccessControl.isAdmin(accessControlState, caller)) {
      #admin;
    } else {
      #user;
    };

    let profile : UserProfile = {
      id = caller;
      name = name;
      phone = phone;
      email = email;
      role = role;
    };

    userProfiles.add(caller, profile);
  };
};
