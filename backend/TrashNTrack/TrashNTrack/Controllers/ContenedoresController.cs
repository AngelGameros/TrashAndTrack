using Microsoft.AspNetCore.Mvc;
using System;
using System.Collections.Generic;
using Microsoft.Data.SqlClient;
using System.Data;
using System.Linq;

[Route("api/[controller]")]
[ApiController]
public class ContenedoresController : ControllerBase
{
    [HttpGet]
    public ActionResult GetAll()
    {
        try
        {
            var contenedores = Contenedor.GetAll();
            return Ok(ContenedorListResponse.GetResponse(contenedores));
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
            var contenedor = Contenedor.GetById(id);

            if (contenedor == null)
                return NotFound(new
                {
                    status = 1,
                    message = $"Contenedor con ID {id} no encontrado",
                    type = "error"
                });

            return Ok(ContenedorResponse.GetResponse(contenedor));
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

    [HttpGet("empresa/{idEmpresa}")]
public IActionResult GetContenedoresPorEmpresa(int idEmpresa)
{
    try
    {
        // Consulta a la vista
        SqlCommand cmd = new SqlCommand("SELECT * FROM ContenedoresPorEmpresa WHERE id_empresa = @idEmpresa");
        cmd.Parameters.AddWithValue("@idEmpresa", idEmpresa);

        DataTable resultado = SqlServerConnection.ExecuteQuery(cmd);

        if (resultado.Rows.Count == 0)
        {
            return NotFound(new
            {
                status = -1,
                message = "No se encontraron contenedores para esta empresa"
            });
        }

        // Extraer datos de empresa de la primera fila
        var empresa = new
        {
            id = Convert.ToInt32(resultado.Rows[0]["id_empresa"]),
            nombre = resultado.Rows[0]["nombre"].ToString()
        };

        // Lista de contenedores
        var contenedores = resultado.Rows.Cast<DataRow>().Select(row => new
        {
            id = Convert.ToInt32(row["id_contenedor"]),
            descripcion = row["descripcion_contenedor"].ToString(),
            fechaRegistro = Convert.ToDateTime(row["fecha_registro"]).ToString("yyyy-MM-dd"),
            tipoContenedor = row["tipo_contenedor"]?.ToString(),
            capacidadMaxima = row["capacidad_maxima"] != DBNull.Value ? Convert.ToDecimal(row["capacidad_maxima"]) : 0,
            tipoResiduo = row["tipo_residuo"]?.ToString()
        }).ToList();

        // Respuesta
        return Ok(new
        {
            status = 0,
            message = "Contenedores obtenidos correctamente",
            empresa,
            contenedores
        });
    }
    catch (Exception ex)
    {
        return StatusCode(500, new
        {
            status = -1,
            message = "Error al obtener los contenedores",
            errorDetails = ex.Message
        });
    }
}


    [HttpGet("por-tipo-residuo/{tipoResiduoId}")]
    public ActionResult GetByTipoResiduo(int tipoResiduoId)
    {
        try
        {
            var contenedores = Contenedor.GetByTipoResiduo(tipoResiduoId);
            return Ok(ContenedorListResponse.GetResponse(contenedores));
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

    [HttpGet("por-estado/{estado}")]
    public ActionResult GetByEstado(string estado)
    {
        try
        {
            var contenedores = Contenedor.GetByEstado(estado);
            return Ok(ContenedorListResponse.GetResponse(contenedores));
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