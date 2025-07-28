using Microsoft.AspNetCore.Mvc;
using Microsoft.Data.SqlClient;
using Newtonsoft.Json;
using System;
using System.Collections.Generic;
using System.Data;
using System.Linq;

[Route("api/[controller]")]
[ApiController]
public class RutasController : ControllerBase
{
    [HttpGet]
    public ActionResult GetAll()
    {
        try
        {
            var rutas = Ruta.GetAll();
            return Ok(RutaListResponse.GetResponse(rutas));
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
            var ruta = Ruta.GetById(id);

            if (ruta == null)
                return NotFound(new
                {
                    status = 1,
                    message = $"Ruta con ID {id} no encontrada",
                    type = "error"
                });

            return Ok(RutaResponse.GetResponse(ruta));
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

    [HttpGet("detalladas")]
    public ActionResult GetRutasDetalladas()
    {
        try
        {
            var query = "SELECT * FROM vista_rutas_detalladas";
            var command = new SqlCommand(query);
            var table = SqlServerConnection.ExecuteQuery(command);

            var rutas = RutaDetalladaMapper.MapFromDataTable(table);
            return Ok(RutaDetalladaResponse.GetResponse(rutas));
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

    [HttpGet("detalladas/{id}")]
    public ActionResult GetRutaDetalladaPorId(int id)
    {
        try
        {
            var query = "SELECT * FROM vista_rutas_detalladas WHERE id_usuario_asignado = @id";
            var command = new SqlCommand(query);
            command.Parameters.AddWithValue("@id", id);

            var table = SqlServerConnection.ExecuteQuery(command);
            var rutas = RutaDetalladaMapper.MapFromDataTable(table);

            if (rutas.Count == 0)
            {
                return NotFound(new
                {
                    status = 1,
                    message = $"El usuario con id {id} no tiene rutas asignadas",
                    type = "error"
                });
            }

            return Ok(new
            {
                status = 0,
                message = "Consulta exitosa",
                type = "success",
                data = rutas
            });
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

    [HttpPut("update-progress")]
    public IActionResult UpdateRutaProgressAndStatus([FromBody] UpdateRutaProgressStatusRequest request)
    {
        if (!ModelState.IsValid)
        {
            return BadRequest(new { status = 1, message = "Datos de entrada inválidos." });
        }

        bool success = Ruta.UpdateProgresoAndEstado(request.IdRuta, request.ProgresoRuta, request.Estado);

        if (success)
        {
            return Ok(new { status = 0, message = "Progreso y estado de la ruta actualizados correctamente." });
        }
        else
        {
            return StatusCode(500, new { status = 1, message = "No se pudo actualizar el progreso y estado de la ruta o la ruta no fue encontrada." });
        }
    }
}
public class UpdateRutaProgressStatusRequest
{
    public int IdRuta { get; set; }
    public int ProgresoRuta { get; set; }
    public string Estado { get; set; }
}