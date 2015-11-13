using Microsoft.Owin;
using Owin;

[assembly: OwinStartupAttribute(typeof(WeatherReport.Startup))]
namespace WeatherReport
{
    public partial class Startup
    {
        public void Configuration(IAppBuilder app)
        {
            ConfigureAuth(app);
        }
    }
}
