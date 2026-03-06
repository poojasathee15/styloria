import Map "mo:core/Map";
import Nat "mo:core/Nat";
import Array "mo:core/Array";
import Text "mo:core/Text";
import List "mo:core/List";
import Iter "mo:core/Iter";
import Runtime "mo:core/Runtime";
import Principal "mo:core/Principal";
import Migration "migration";

import MixinAuthorization "authorization/MixinAuthorization";
import AccessControl "authorization/access-control";

(with migration = Migration.run)
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
    #skin;
    #nails;
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
    profilePictureUrl : Text;
  };

  type AdminStats = {
    totalBookings : Nat;
    totalRevenue : Nat;
    pendingCount : Nat;
    confirmedCount : Nat;
    completedCount : Nat;
    cancelledCount : Nat;
    todayBookingsCount : Nat;
    upcomingBookingsCount : Nat;
  };

  type GalleryPhoto = {
    id : Nat;
    title : Text;
    category : Text;
    imageUrl : Text;
    uploadedAt : Text;
  };

  var nextServiceId = 1;
  var nextAppointmentId = 1;
  var nextPaymentId = 1;
  var nextGalleryPhotoId = 1;

  let services = Map.empty<Nat, Service>();
  let appointments = Map.empty<Nat, Appointment>();
  let payments = Map.empty<Nat, Payment>();
  let userProfiles = Map.empty<Principal, UserProfile>();
  let galleryPhotos = Map.empty<Nat, GalleryPhoto>();

  let accessControlState = AccessControl.initState();
  include MixinAuthorization(accessControlState);

  public shared ({ caller }) func createService(
    name : Text,
    category : ServiceCategory,
    price : Nat,
    durationMinutes : Nat,
    description : Text,
    imageUrl : Text,
    isActive : Bool,
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
    isActive : Bool,
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

  public shared ({ caller }) func createAppointment(
    serviceId : Nat,
    date : Text,
    timeSlot : Text,
    notes : Text,
  ) : async Nat {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can create appointments");
    };

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
    status : AppointmentStatus,
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
    let bookedSlots = List.empty<Text>();
    for (appointment in appointments.values()) {
      if (appointment.date == date and (appointment.status == #pending or appointment.status == #confirmed)) {
        bookedSlots.add(appointment.timeSlot);
      };
    };

    let allSlots = List.empty<Text>();
    var hour = 9;
    while (hour < 18) {
      let hourStr = if (hour < 10) { "0" # hour.toText() } else { hour.toText() };
      allSlots.add(hourStr # ":00");
      allSlots.add(hourStr # ":30");
      hour += 1;
    };
    allSlots.add("18:00");

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

  public shared ({ caller }) func createPayment(
    appointmentId : Nat,
    amount : Nat,
  ) : async Nat {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can create payments");
    };

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
    switch (payments.get(paymentId)) {
      case (null) { Runtime.trap("Payment not found") };
      case (?payment) {
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
    switch (appointments.get(appointmentId)) {
      case (null) { Runtime.trap("Appointment not found") };
      case (?appointment) {
        if (appointment.userId != caller and not AccessControl.isAdmin(accessControlState, caller)) {
          Runtime.trap("Unauthorized: Can only view payments for your own appointments");
        };

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

  public query ({ caller }) func getAdminStats(todayDate : Text) : async AdminStats {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Runtime.trap("Unauthorized: Only admins can view statistics");
    };

    var totalBookings = 0;
    var totalRevenue = 0;
    var pendingCount = 0;
    var confirmedCount = 0;
    var completedCount = 0;
    var cancelledCount = 0;
    var todayBookingsCount = 0;
    var upcomingBookingsCount = 0;

    for (appointment in appointments.values()) {
      totalBookings += 1;
      switch (appointment.status) {
        case (#pending) { pendingCount += 1 };
        case (#confirmed) { confirmedCount += 1 };
        case (#completed) { completedCount += 1 };
        case (#cancelled) { cancelledCount += 1 };
      };

      if (appointment.date == todayDate) {
        todayBookingsCount += 1;
      } else if ((appointment.status == #pending or appointment.status == #confirmed) and appointment.date >= todayDate) {
        upcomingBookingsCount += 1;
      };
    };

    for (payment in payments.values()) {
      if (payment.status == #completed) {
        totalRevenue += payment.amount;
      };
    };

    {
      totalBookings;
      totalRevenue;
      pendingCount;
      confirmedCount;
      completedCount;
      cancelledCount;
      todayBookingsCount;
      upcomingBookingsCount;
    };
  };

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
    email : Text,
    profilePictureUrl : Text,
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
      name;
      phone;
      email;
      role;
      profilePictureUrl;
    };

    userProfiles.add(caller, profile);
  };

  public query ({ caller }) func listAllUserProfiles() : async [UserProfile] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Runtime.trap("Unauthorized: Only admins can list user profiles");
    };
    Array.fromIter(userProfiles.values());
  };

  public query func listGalleryPhotos() : async [GalleryPhoto] {
    Array.fromIter(galleryPhotos.values());
  };

  public shared ({ caller }) func addGalleryPhoto(
    title : Text,
    category : Text,
    imageUrl : Text,
    uploadedAt : Text,
  ) : async Nat {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Runtime.trap("Unauthorized: Only admins can add gallery photos");
    };

    let photoId = nextGalleryPhotoId;
    let galleryPhoto : GalleryPhoto = {
      id = photoId;
      title;
      category;
      imageUrl;
      uploadedAt;
    };

    galleryPhotos.add(photoId, galleryPhoto);
    nextGalleryPhotoId += 1;
    photoId;
  };

  public shared ({ caller }) func deleteGalleryPhoto(photoId : Nat) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Runtime.trap("Unauthorized: Only admins can delete gallery photos");
    };

    switch (galleryPhotos.get(photoId)) {
      case (null) { Runtime.trap("Gallery photo not found") };
      case (?_) {
        galleryPhotos.remove(photoId);
      };
    };
  };
};
