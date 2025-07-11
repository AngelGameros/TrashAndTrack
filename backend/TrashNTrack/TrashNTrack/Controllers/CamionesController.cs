using Microsoft.AspNetCore.Mvc;
using System;
using System.Collections.Generic;

[Route("api/[controller]")]
[ApiController]
public class CamionesController : ControllerBase
{
    [HttpGet]
    public ActionResult GetAll()
    {
        var listaCamiones = Camiones.Get(); // Obtener la lista de camiones
        var response = CamionesListResponse.GetResponse(listaCamiones); // Generar la respuesta
        return Ok(response); // Retornar al cliente
    }

    [HttpGet("{id}")]
    public ActionResult GetById(int id)
    {
        var camion = Camiones.Get(id);
        var response = CamionesResponse.GetResponse(camion);
        return Ok(response);
    }
}
