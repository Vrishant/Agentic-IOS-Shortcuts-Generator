// shortcuts_data.js
const ACTIONS = [
    {
      name: "Send Message",
      id: "com.apple.MobileSMS.sendMessage",
      description: "Sends a text message or iMessage to a specific recipient.",
      syntax: "SendMessage(content: String, recipients: [Contact])",
      parameters: [
        { name: "Content", type: "String", required: true },
        { name: "Recipients", type: "Array<Contact>", required: true }
      ]
    },
    {
      name: "Get Current Location",
      id: "com.apple.Maps.GetCurrentLocation",
      description: "Obtains the device's current GPS location.",
      syntax: "Location.getCurrent(precision: .best)",
      parameters: [
        { name: "Precision", type: "Enum", options: ["Best", "Nearest Ten Meters"] }
      ]
    },
    {
      name: "Get Travel Time",
      id: "com.apple.Maps.GetTravelTime",
      description: "Calculates the estimated travel time to a destination.",
      syntax: "Location.getTravelTime(to: Location, transportType: .automobile)",
      parameters: [
        { name: "Destination", type: "Location", required: true },
        { name: "Transport Type", type: "Enum", options: ["Driving", "Walking", "Transit"] }
      ]
    },
    {
      name: "Log Health Sample",
      id: "com.apple.Health.LogSample",
      description: "Logs a data point (like weight or steps) into the Health app.",
      syntax: "Health.logSample(type: HealthType, value: Number, date: Date)",
      parameters: [
        { name: "Type", type: "Enum", required: true },
        { name: "Value", type: "Number", required: true }
      ]
    }
  ];
  
  module.exports = { ACTIONS };