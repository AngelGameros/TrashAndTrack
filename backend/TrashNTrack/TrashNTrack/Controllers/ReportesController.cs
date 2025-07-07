using Microsoft.AspNetCore.Mvc;
using System;
using System.Collections.Generic;

[Route("api/[controller]")]
[ApiController]
public class ReportesController : ControllerBase
{
    [HttpGet]
    public ActionResult GetAll()
    {
        try
        {
            var reportes = Reporte.GetAll();
            return Ok(ReporteListResponse.GetResponse(reportes));
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
            var reporte = Reporte.GetById(id);

            if (reporte == null)
                return NotFound(new
                {
                    status = 1,
                    message = $"Reporte con ID {id} no encontrado",
                    type = "error"
                });

            return Ok(ReporteResponse.GetResponse(reporte));
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
            var reportes = Reporte.GetByUsuario(usuarioId);
            return Ok(ReporteListResponse.GetResponse(reportes));
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
            var reportes = Reporte.GetByDateRange(fechaInicio, fechaFin);
            return Ok(ReporteListResponse.GetResponse(reportes));
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