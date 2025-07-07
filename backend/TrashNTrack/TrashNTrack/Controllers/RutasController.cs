using Microsoft.AspNetCore.Mvc;
using System;
using System.Collections.Generic;

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

    [HttpGet("por-empresa/{empresaId}")]
    public ActionResult GetByEmpresa(int empresaId)
    {
        try
        {
            var rutas = Ruta.GetByEmpresa(empresaId);
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

    [HttpGet("por-planta/{plantaId}")]
    public ActionResult GetByPlanta(int plantaId)
    {
        try
        {
            var rutas = Ruta.GetByPlanta(plantaId);
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
}