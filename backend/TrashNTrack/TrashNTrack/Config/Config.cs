using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
public class Config
{
    public ConfigSqlServer SqlServer { get; set; }
    public ConfigPaths Paths { get; set; }
    public static Config Configuration { get; set; }
}