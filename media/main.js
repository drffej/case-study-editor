// @ts-nocheck

// This script will be run within the webview itself
// It cannot access the main VS Code APIs directly.

(function () {
    const vscode = acquireVsCodeApi();
    var resetVals = {};

    const oldState = vscode.getState() || { colors: [] };
    //console.log("loading");
        // Handle messages sent from the extension to the webview
    window.addEventListener('message', event => {
        //console.log(event);
        const message = event.data; // The json data that the extension sent
        switch (message.command) {
            case 'load':
                {
                    //console.log('load:');
                    //console.log(message.customer);
                    loadForm(message.customer, message.technologies, message.sectors);
                    resetVals = message;  // stash form values
                    break;
                }
            case 'reload':
                {
                    resetVals = message;
                    if ( message.customer.customer !== message.customer.newCustomer ){
                      bEdited = true;
                      message.customer.customer = message.customer.newCustomer;
                      //console.log("reset customer");
                      enableButtons();
                    }
                    loadForm(message.customer, message.technologies, message.sectors);
                    break;
                } 
            case 'save':
                {
                    //console.log('save');
                    disableButtons();
                    saveForm();
                    break;
                }

        }
    });

    function stash(){
        customer.newCustomer = getTextForm('customer');
        customer.byline = getTextForm('byline');
        customer.solution = getTextForm('challenge');
        customer.url = getTextForm('url');
        customer.country = getTextForm('country');
        // technologies updated via add/remove buttons
        postMessage('edited',customer);
    };

    /*
     * post message
     */
    function postMessage(cmd,msg){
        //console.log({command: cmd, message:msg });
        vscode.postMessage({command: cmd, message:msg });
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
    reset.onclick = function(){ postMessage('reset','');};
      
      
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
        addBut.disabled = true;
        removeBut.disabled = true;
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
          stash();
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
          stash();
          enableButtons();
        }
      };
  
      /* load form with values
       */
      function loadForm(thisCustomer, thisTechnologies, thisSectors){
        // set data
        bEdited = false;
        sectors = thisSectors;
        technologies = thisTechnologies;
        customer = thisCustomer;
        remainingTechnologies = [];
        technologies.forEach(element => {
          if (!customer.technologies.includes(element)){
            remainingTechnologies.push(element);
          }
        });
        
        // load form
        loadSelect('technology-list',remainingTechnologies,'');
        loadSelect('technologies',customer.technologies,'');
        loadSelect('sector',sectors,customer.sector);
  
        loadTextForm("customer",customer.customer);
        loadTextForm("byline",customer.byline);
        loadTextForm("solution",customer.solution);
        loadTextForm("challenge",customer.challenge);
        loadTextForm("url",customer.url);
        loadTextForm("country",customer.country);
        
        // set buttons
        disableButtons();


      }
  
      /*
       * saveForm - post back customer record
       */
      save.onclick = function(){
        saveForm();
        disableButtons();
      };
      
      function saveForm(){
        customer.newCustomer = getTextForm('customer');
        customer.byline = getTextForm('byline');
        customer.solution = getTextForm('challenge');
        customer.url = getTextForm('url');
        customer.country = getTextForm('country');
        // technologies updated via add/remove buttons
        postMessage('save',customer);
      };

      // listen for form change events
      var form = document.querySelector("form");
      form.addEventListener('input', function(e) {
        //console.log(e.target.id);
        if (e.target.id !== 'technology-list' && e.target.id !== 'technologies'){
          bEdited = true;
          stash();
          enableButtons();
        }
      });

  

    
}());


