using Microsoft.AspNetCore.Mvc;
using System;
using System.Collections.Generic;

[Route("api/[controller]")]
[ApiController]
public class IncidentesController : ControllerBase
{
    [HttpGet]
    public ActionResult GetAll()
    {
        try
        {
            var incidentes = Incidente.GetAll();
            return Ok(IncidenteListResponse.GetResponse(incidentes));
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
            var incidente = Incidente.GetById(id);

            if (incidente == null)
                return NotFound(new
                {
                    status = 1,
                    message = $"Incidente con ID {id} no encontrado",
                    type = "error"
                });

            return Ok(IncidenteResponse.GetResponse(incidente));
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

    [HttpGet("por-usuario/{usuarioId}")]
    public ActionResult GetByUsuario(int usuarioId)
    {
        try
        {
            var incidentes = Incidente.GetByUsuario(usuarioId);
            return Ok(IncidenteListResponse.GetResponse(incidentes));
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

    [HttpGet("por-fecha")]
    public ActionResult GetByDateRange([FromQuery] DateTime fechaInicio, [FromQuery] DateTime fechaFin)
    {
        try
        {
            var incidentes = Incidente.GetByDateRange(fechaInicio, fechaFin);
            return Ok(IncidenteListResponse.GetResponse(incidentes));
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

    [HttpPost]
    public ActionResult Create([FromBody] Incidente incidente)
    {
        try
        {
            if (string.IsNullOrWhiteSpace(incidente.Nombre))
                return BadRequest(new
                {
                    status = 2,
                    message = "El nombre del incidente es requerido",
                    type = "error"
                });

            int id = Incidente.Create(incidente);
            return Ok(IncidenteResponse.GetCreateResponse(id));
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