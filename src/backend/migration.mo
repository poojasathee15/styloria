import Map "mo:core/Map";
import Nat "mo:core/Nat";
import Principal "mo:core/Principal";

module {
  type OldUserProfile = {
    id : Principal;
    name : Text;
    phone : Text;
    email : Text;
    role : {
      #admin;
      #user;
    };
  };

  type OldActor = {
    services : Map.Map<Nat, {
      id : Nat;
      name : Text;
      category : {
        #hair;
        #makeup;
        #skin;
        #nails;
      };
      price : Nat;
      durationMinutes : Nat;
      description : Text;
      imageUrl : Text;
      isActive : Bool;
    }>;
    appointments : Map.Map<Nat, {
      id : Nat;
      userId : Principal;
      serviceId : Nat;
      date : Text;
      timeSlot : Text;
      notes : Text;
      status : {
        #pending;
        #confirmed;
        #completed;
        #cancelled;
      };
    }>;
    payments : Map.Map<Nat, {
      id : Nat;
      appointmentId : Nat;
      amount : Nat;
      status : {
        #pending;
        #completed;
        #failed;
      };
    }>;
    userProfiles : Map.Map<Principal, OldUserProfile>;
    galleryPhotos : Map.Map<Nat, {
      id : Nat;
      title : Text;
      category : Text;
      imageUrl : Text;
      uploadedAt : Text;
    }>;
    nextServiceId : Nat;
    nextAppointmentId : Nat;
    nextPaymentId : Nat;
    nextGalleryPhotoId : Nat;
  };

  type NewUserProfile = {
    id : Principal;
    name : Text;
    phone : Text;
    email : Text;
    role : {
      #admin;
      #user;
    };
    profilePictureUrl : Text;
  };

  type NewActor = {
    services : Map.Map<Nat, {
      id : Nat;
      name : Text;
      category : {
        #hair;
        #makeup;
        #skin;
        #nails;
      };
      price : Nat;
      durationMinutes : Nat;
      description : Text;
      imageUrl : Text;
      isActive : Bool;
    }>;
    appointments : Map.Map<Nat, {
      id : Nat;
      userId : Principal;
      serviceId : Nat;
      date : Text;
      timeSlot : Text;
      notes : Text;
      status : {
        #pending;
        #confirmed;
        #completed;
        #cancelled;
      };
    }>;
    payments : Map.Map<Nat, {
      id : Nat;
      appointmentId : Nat;
      amount : Nat;
      status : {
        #pending;
        #completed;
        #failed;
      };
    }>;
    userProfiles : Map.Map<Principal, NewUserProfile>;
    galleryPhotos : Map.Map<Nat, {
      id : Nat;
      title : Text;
      category : Text;
      imageUrl : Text;
      uploadedAt : Text;
    }>;
    nextServiceId : Nat;
    nextAppointmentId : Nat;
    nextPaymentId : Nat;
    nextGalleryPhotoId : Nat;
  };

  public func run(old : OldActor) : NewActor {
    let newUserProfiles = old.userProfiles.map<Principal, OldUserProfile, NewUserProfile>(
      func(_id, oldUserProfile) {
        {
          oldUserProfile with
          profilePictureUrl = "";
        };
      }
    );
    {
      old with
      userProfiles = newUserProfiles;
    };
  };
};
