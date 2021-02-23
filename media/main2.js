

var customer2 = {
    "customer": "Emerald Performance Materials",
      "country": "United States",
      "sector": "Manufacturing",
      "url": "https://www.fujitsu.com/global/Images/CS_2020Nov_Emerald-Performance-Materials.pdf",
      "challenge": "Emerald Performance Materials wanted to move from its existing private hosted cloud environment to Microsoft Azure.",
      "solution": "Fujitsu designed, configured, and secured the Microsoft Azure infrastructure",
      "byline": "Boosting agility for improved performance",
      "technologies": [
        "Azure Data Factory v2",
        "Azure Monitor",
        "Backup",
        "Bandwidth",
        "Load Balancer",
        "Log Analytics",
        "Network Watcher",
        "Storage",
        "Virtual Machines",
        "Virtual Machines Licenses",
        "Virtual Network"
      ]
};

var sectors2 = [
    "Utilities",
    "Retail & Hospitality",
    "Financial Services",
    "Government",
    "Health",
    "Manufacturing",
    "Media & Telco",
    "Construction",
    "Unknown"
  ];
var technologies2 =  [
    "Advanced Data Security",
    "Advanced Threat Protection",
    "API Management",
    "App Center",
    "App Configuration",
    "Application Gateway",
    "Application Insights",
    "Automation",
    "Azure Active Directory B2C",
    "Azure Active Directory Domain Services",
    "Azure Active Directory for External Identities",
    "Azure Analysis Services",
    "Azure App Service",
    "Azure Bastion",
    "Azure Blockchain",
    "Azure Bot Service",
    "Azure Cognitive Search",
    "Azure Cosmos DB",
    "Azure Data Explorer",
    "Azure Data Factory",
    "Azure Data Factory v2",
    "Azure Data Share",
    "Azure Database for MariaDB",
    "Azure Database for MySQL",
    "Azure Database for PostgreSQL",
    "Azure Databricks",
    "Azure DDOS Protection",
    "Azure DevOps",
    "Azure DNS",
    "Azure Firewall",
    "Azure Front Door Service",
    "Azure IoT Security",
    "Azure Lab Services",
    "Azure Machine Learning",
    "Azure Maps",
    "Azure Monitor",
    "Azure NetApp Files",
    "Azure Site Recovery",
    "Azure Stack Edge",
    "Azure Stack Hub",
    "Azure Synapse Analytics",
    "Backup",
    "Bandwidth",
    "Cloud Services",
    "Cognitive Services",
    "Container Instances",
    "Container Registry",
    "Content Delivery Network",
    "Data Box",
    "Data Catalog",
    "Data Lake Analytics",
    "Data Lake Store",
    "Event Grid",
    "Event Hubs",
    "ExpressRoute",
    "Functions",
    "HDInsight",
    "Insight and Analytics",
    "IoT Central",
    "IoT Hub",
    "Key Vault",
    "Load Balancer",
    "Log Analytics",
    "Logic Apps",
    "Machine Learning Studio",
    "Media Services",
    "Multi-Factor Authentication",
    "NAT Gateway",
    "Network Watcher",
    "Network Security Groups",
    "Notification Hubs",
    "Power BI Embedded",
    "Redis Cache",
    "Scheduler",
    "Security Center",
    "Sentinel",
    "Service Bus",
    "SignalR",
    "Spatial Anchors",
    "Specialized Compute",
    "SQL Data Warehouse",
    "SQL Database",
    "SQL Managed Instance",
    "Storage",
    "StorSimple",
    "Stream Analytics",
    "Time Series Insights",
    "Traffic Manager",
    "Virtual Machines",
    "Virtual Machines Licenses",
    "Virtual Network",
    "Virtual WAN",
    "Visual Studio Codespaces",
    "VPN Gateway"
  ];

    /*
     * post message
     */
    function postMessage(cmd,msg){
      console.log({command: cmd, message:msg });
    }
    /**
     * 
     * Set Form values
     */
    const technologySelect = document.getElementById('technology-list');
    const technologiesSelect = document.getElementById('technologies');
    const addBut = document.getElementById('but-add');
    const removeBut = document.getElementById('but-remove');
    const save = document.getElementById('but-save');
    const reset = document.getElementById('but-reset');
    technologySelect.onclick = function(){addBut.disabled = false; };
    technologiesSelect.onclick = function(){removeBut.disabled = false;};
    reset.onclick = function(){postMessage('reset',{});};
    
    
    /*
     * Variables
     */
    var remainingTechnologies = [];
    var bEdited = false;
    var sectors = [];
    var technologies = [];
    var customer = {};

    /**
     * load Technologies fom array
     * selector: String
     * technologies: Array<String>
     * selected: string
     */
    function loadSelect(selector, list, selected){
      // empty selection
      const select = document.getElementById(selector);
      select.options.length = 0;

      // load selection
      list.forEach(function(element, key) {
        var bSelected = false;
        if (element === selected){
          bSelected = true; 
        }
        else {
          bSelected = false;
        }
        select.options[select.options.length] = new Option(element, select.options.length,false, bSelected);
      });   
    }

    /*
     * loadTextForm
     * selector: string
     * value: string
     */
    function loadTextForm(selector, value){
      const text = document.getElementById(selector);
      text.value = value;
    }

    /*
     * getTextForm
     */
    function getTextForm(selector){
      const text = document.getElementById(selector);
      return text.value;
    }

    /*
     * enable buttons
     */
    function enableButtons(){
      save.disabled = false;
      reset.disabled = false;
    }

    /*
     * disable buttons
     */
    function disableButtons(){
      save.disabled = true;
      reset.disabled = true;
    }


    /* add technology to technology list
     */
    addBut.onclick = function(){  
      const selectedIndex = technologySelect.selectedIndex;
      if (selectedIndex >= 0){
        selection = remainingTechnologies[selectedIndex];
        customer.technologies.push(selection);
        customer.technologies.sort();
        loadSelect('technologies',customer.technologies,selection);
        remainingTechnologies.splice(selectedIndex,1);
        loadSelect('technology-list',remainingTechnologies,'');
        removeBut.disabled = false;
        bEdited = true;
        postMessage('edited',{});
        enableButtons();
      }
    };
    /* remove technology from technology list
     */
    removeBut.onclick = function(){
      const selectedIndex = technologiesSelect.selectedIndex;
      if (selectedIndex >= 0){
        selection = customer.technologies[selectedIndex];
        remainingTechnologies.push(selection);
        remainingTechnologies.sort();
        loadSelect('technologies',customer.technologies,'');
        customer.technologies.splice(selectedIndex,1);
        loadSelect('technology-list',remainingTechnologies,selection);
        addBut.disabled = false;
        bEdited = true;
        postMessage('edited',{});
        enableButtons();
      }
    };

    /* load form with values
     */
    function loadForm(thisCustomer, thisTechnologies, thisSectors){
      sectors = thisSectors;
      technologies = thisTechnologies;
      customer = thisCustomer;
      remainingTechnologies = [];
      technologies.forEach(element => {
        if (!customer.technologies.includes(element)){
          remainingTechnologies.push(element);
        }
      });

      loadSelect('technology-list',remainingTechnologies,'');
      loadSelect('technologies',customer.technologies,'');
      loadSelect('sector',sectors,customer.sector);

      loadTextForm("customer",customer.customer);
      loadTextForm("byline",customer.byline);
      loadTextForm("solution",customer.solution);
      loadTextForm("challenge",customer.challenge);
      loadTextForm("url",customer.url);
      loadTextForm("country",customer.country);
    }
    loadForm(customer2, technologies2, sectors2);

    /*
     * saveForm - post back customer record
     */
    save.onclick = function(){
      customer.customer = getTextForm('customer');
      customer.byline = getTextForm('byline');
      customer.solution = getTextForm('challenge');
      customer.url = getTextForm('url');
      customer.country = getTextForm('country');
      postMessage('save',customer);

    };
    
    // listen for change events
    var form = document.querySelector("form");
    form.addEventListener('input', function(e) {
      console.log(e.target.id);
      if (e.target.id !== 'technology-list' && e.target.id !== 'technologies'){
        bEdited = true;
        postMessage('edited',{});
        enableButtons();
      }
    });