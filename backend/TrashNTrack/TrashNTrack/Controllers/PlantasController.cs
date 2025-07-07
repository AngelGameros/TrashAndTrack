using Microsoft.AspNetCore.Mvc;
using System;
using System.Collections.Generic;

[Route("api/[controller]")]
[ApiController]
public class PlantasController : ControllerBase
{
    [HttpGet]
    public ActionResult GetAll()
    {
        try
        {
            var plantas = Planta.GetAll();
            return Ok(PlantaListResponse.GetResponse(plantas));
        }
        catch (Exception ex)
        {
            return StatusCode(500, new
            {
                status = 999,
                message = ex.Message,
                type = "error"
            });
        }
    }

    [HttpGet("{id}")]
    public ActionResult GetById(int id)
    {
        try
        {
            var planta = Planta.GetById(id);

            if (planta == null)
                return NotFound(new
                {
                    status = 1,
                    message = $"Planta con ID {id} no encontrada",
                    type = "error"
                });

            return Ok(PlantaResponse.GetResponse(planta));
        }
        catch (Exception ex)
        {
            return StatusCode(500, new
            {
                status = 999,
                message = ex.Message,
                type = "error"
            });
        }
    }

    [HttpGet("por-ubicacion/{ubicacionId}")]
    public ActionResult GetByUbicacion(int ubicacionId)
    {
        try
        {
            var plantas = Planta.GetByUbicacion(ubicacionId);
            return Ok(PlantaListResponse.GetResponse(plantas));
        }
        catch (Exception ex)
        {
            return StatusCode(500, new
            {
                status = 999,
                message = ex.Message,
                type = "error"
            });
        }
    }
}