using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.AspNetCore;
using Microsoft.AspNetCore.Hosting;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;
using TrashNTrack;

namespace TrashNTrack
{
    public class Program
    {
        public static void Main(string[] args)
        {
            CreateWebHostBuilder(args).Build().Run();
        }

        public static IWebHostBuilder CreateWebHostBuilder(string[] args) =>
    WebHost.CreateDefaultBuilder(args)
        .UseKestrel(options =>
        {
            // Escucha en todas las IPs disponibles en el puerto 5000 (HTTP)
            options.ListenAnyIP(5000);

            // Escucha en todas las IPs disponibles en el puerto 5001 (HTTPS)
            options.ListenAnyIP(5001, listenOptions =>
            {
                listenOptions.UseHttps(); // Requiere que tengas certificado válido (usa el default)
            });
        })
        .UseStartup<Startup>();

    }
}
