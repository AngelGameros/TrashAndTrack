using MongoDB.Bson;
using MongoDB.Bson.Serialization.Attributes;
using System;
using System.Collections.Generic;

public class ContainerInfo
{
    [BsonId]
    [BsonRepresentation(BsonType.ObjectId)]
    public string Id { get; set; }

    public string DeviceID { get; set; }
    public int ClientID { get; set; }
    public string Name { get; set; }
    public string Status { get; set; }
    public string Type { get; set; }
    public double MaxWeight_kg { get; set; }
    public SensorValues Values { get; set; }

    // Fechas que manejan la creación y la última actualización
    [BsonElement("createdAt")]
    public DateTime CreatedAt { get; set; }

    [BsonElement("updatedAt")]
    public DateTime UpdatedAt { get; set; }
}

public class SensorValues
{
    public double ToC { get; set; }
    public double RH { get; set; }
    public double CO2_PPM { get; set; }
    public double GLP_PPM { get; set; }
    public double CH4_PPM { get; set; }
    public double H2_PPM { get; set; }
}