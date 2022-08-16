import { LightningElement,api, track } from 'lwc';
import createProducts from '@salesforce/apex/cpqApex.createProducts';
import getLastPaid from '@salesforce/apex/cpqApex.getLastPaid'; 
import getLastQuote from '@salesforce/apex/cpqApex.getLastQuote';
import getInventory from '@salesforce/apex/cpqApex.getInventory';
import onLoadGetInventory from '@salesforce/apex/cpqApex.onLoadGetInventory';
import getProducts from '@salesforce/apex/cpqApex.getProducts';
import inCounts from '@salesforce/apex/cpqApex.inCounts';
import onLoadGetLastPaid from '@salesforce/apex/cpqApex.onLoadGetLastPaid';
import onLoadGetLevels from '@salesforce/apex/cpqApex.getLevelPricing';
import onLoadGetLastQuoted from '@salesforce/apex/cpqApex.onLoadGetLastQuoted';
import {updateRecord, deleteRecord } from 'lightning/uiRecordApi';
import ID_FIELD from '@salesforce/schema/Opportunity.Id';
import SHIPCHARGE from '@salesforce/schema/Opportunity.Shipping_Total__c';
import {mergeInv,mergeLastPaid, lineTotal, onLoadProducts , newInventory, handleWarning,updateNewProducts, mergeLastQuote, getTotals, roundNum,totalChange, checkPricing, getShipping, allInventory} from 'c/mh2'
import { FlowNavigationNextEvent,FlowAttributeChangeEvent, FlowNavigationBackEvent  } from 'lightning/flowSupport';



export default class MobileProdSelected extends LightningElement {
    @api oppId;
    @api warehouse;
    @api accountId; 
    @api pbId;
    @api shipType;  
    @api stage; 
    showDelete = false;  
    addProducts = false;
    shipAddress = false; 
    showProducts=true;
    submitted = false;  
    wasEdited = true 
    @track prod = [] 
    @track backUp = [];
    showSpinner = true;
    goodPricing = true; 
    editAllText = 'Edit All';
    productCode;
    productName;
    productId;
    pbeId;
    unitCost;
    agProduct;
    floorPrice;
    floorType;
    levelOne; 
    levelTwo;
    levelTwoMargin; 
    palletConfig; 
    shipWeight;
    total; 
    lastQuote; 
    
    hasRendered = true;
    dropShip;
    connectedCallback() {
        //console.log(1, this.shipType);
        if(this.stage ==='Closed Won'|| this.stage === 'Closed Lost'){
            this.submitted = true; 
        }
        //if ship type is drop ship we allow save regardless of pricing. 
        this.dropShip = this.shipType === 'DS'? true: false; 
        this.loadProducts(); 
        
    }
    renderedCallback(){
       //console.log(2, this.shipType);
        
        if(this.prod.length>0 && this.hasRendered){
            this.initPriceCheck();
        }

    }
    //on load get products
    //get last paid next
    async loadProducts(){
        //inventory vars
        let inSet = new Set();
        let prodIdInv = []; 
        let inCode = new Set();
        let codes = [];
        try{
            //console.log(this.oppId);
            
            let results = await getProducts({oppId: this.oppId})
            console.log(1, results.length);
            
            if(results.length < 1){
                console.log('should stop')
                this.showSpinner = false;
                return; 
            }else if(results.length>0){

                results.forEach(item =>{
                    inSet.add(item.Product2Id);
                    inCode.add(item.Product2.ProductCode)
                });
                prodIdInv = [...inSet];
                
                codes = [...inCode]; 
            }
            //console.log('results '+JSON.stringify(results));
            
            let invenCheck = await onLoadGetInventory({locId: this.warehouse, pIds: prodIdInv});
            //console.log('invCheck '+JSON.stringify(invenCheck));
            
            
            let lastPaid = await onLoadGetLastPaid({accountId: this.accountId, productCodes:codes})
            let lastQuote = await onLoadGetLastQuoted({accountId: this.accountId, productCodes: codes, opportunityId: this.oppId});
            
            let priceLevels = await onLoadGetLevels({priceBookId: this.pbId, productIds:prodIdInv})
            
            //MERGE the inventory and saved products. 
            let mergedInven = await mergeInv(results,invenCheck);
            //merge last paid saved products
            let mergedLastPaid = await mergeLastPaid(mergedInven,lastPaid); 
            
            //merge last quote
            mergedLastPaid = await mergeLastQuote(mergedInven, lastQuote); 
            //MERGE the price levels and saved products
            let mergedLevels = await mergeInv(mergedLastPaid, priceLevels);
            
            
            //IF THERE IS A PROBLEM NEED TO HANDLE THAT STILL!!!
            this.prod = await onLoadProducts(mergedLevels, this.recordId); 
            //console.log(JSON.stringify(this.prod))
            this.backUp = this.prod; 
            this.showSpinner =false; 
         }catch(error){
            let mess = error; 
            console.error('error ==> '+JSON.stringify(error));
           alert('error '+error.body); 
            
        }finally{
            this.prodFound = true; 
        }

    }

    handleAction(e){
        let action = e.detail.value
        let index = this.prod.findIndex(x => x.Product2Id === e.target.name)
        
        switch (action) {
            case 'Edit':
                this.edit(index)
                break;
            case 'Info':
                this.info(index)
                break; 
            case 'Delete':
                this.handleDelete(index);
                break; 
            default:
                console.log('default action');
                break;
        }
        
    }
    //check if it's an agency product then which fields are editable at this point
    edit(index){
        if(this.prod[index].Agency__c && this.prod[index].editQTY === true){
             this.prod[index].editQTY = false;   
        }else if(this.prod[index].Agency__c && this.prod[index].editQTY === false){
             this.prod[index].editQTY = true; 
        }else if(this.prod[index].readOnly === false && this.prod[index].showInfo === false){
             this.prod[index].readOnly = true;
             this.prod[index].editQTY = true;
        }else if(this.prod[index].readOnly === false && this.prod[index].showInfo === true){
             this.prod[index].showInfo = false; 
             this.prod[index].readOnly = false;
             this.prod[index].editQTY = false;  
        }else{
             this.prod[index].readOnly = false;
             this.prod[index].editQTY = false; 
        }  
    }

    //edit all products at once
    editAll(){
        if(this.editAllText ==='Edit All'){
            this.editAllText = 'Close All'; 
        }else{
            this.editAllText = 'Edit All'; 
        }
        for (let index = 0; index < this.prod.length; index++){
             if(this.prod[index].Agency__c && this.prod[index].editQTY === true){
                 this.prod[index].editQTY = false;   
             }else if(this.prod[index].Agency__c && this.prod[index].editQTY === false){
                 this.prod[index].editQTY = true; 
             }else if(this.prod[index].readOnly === false && this.prod[index].showInfo === false){
                 this.prod[index].readOnly = true;
                 this.prod[index].editQTY = true;
             }else if(this.prod[index].readOnly === false && this.prod[index].showInfo === true){
                 this.prod[index].showInfo = false; 
                 this.prod[index].readOnly = false;
                 this.prod[index].editQTY = false;  
             }else{
                 this.prod[index].readOnly = false;
                 this.prod[index].editQTY = false; 
         }
            
        }
    }
//show qty on hand 
    info(index){
        if(this.prod[index].showInfo === true){
         this.prod[index].showInfo = false;
        }else{
         this.prod[index].showInfo = true; 
        }
    }
    //Handle value changes
    handleQty(qty){
        this.allowSave();
        let index = this.prod.findIndex(prod => prod.Product2Id === qty.target.name);
        this.prod[index].Quantity = Number(qty.detail.value);
        //handle total price change
        if(this.prod[index].UnitPrice > 0){
            this.prod[index].TotalPrice = this.prod[index].Quantity * this.prod[index].UnitPrice; 
        }
    }

    handlePrice(p){
        this.allowSave();
        window.clearTimeout(this.delay);
        let index = this.prod.findIndex(prod => prod.Product2Id === p.target.name);
        
        let targetId = p.target.name; 
        
        
        this.delay = setTimeout(()=>{
            this.prod[index].UnitPrice = Number(p.detail.value);
            if(this.prod[index].UnitPrice > 0){
                this.prod[index].CPQ_Margin__c = Number((1-(this.prod[index].Cost__c /this.prod[index].UnitPrice))*100).toFixed(2)
                this.prod[index].TotalPrice = this.prod[index].Quantity * this.prod[index].UnitPrice;
            }
            let lOne = Number(this.prod[index].lOne);
            let flr = Number(this.prod[index].Floor_Price__c);
            let unitp = Number(this.prod[index].UnitPrice);
            //console.log('handlePrice pass to warning');
            
            this.handleWarning(targetId,lOne, flr, unitp,index );
        },500)
    }

    handleMargin(m){
        window.clearTimeout(this.delay)
        this.allowSave();
        let index = this.prod.findIndex(prod => prod.Product2Id === m.target.name);
        let targetId = m.target.name; 
        
        this.delay = setTimeout(()=>{
            this.prod[index].CPQ_Margin__c = Number(m.detail.value);
            let cost = this.prod[index].Cost__c;
            let num = (1- this.prod[index].CPQ_Margin__c/100)
            if(num > 0){
                this.prod[index].UnitPrice = (cost/num).toFixed(2);
                this.prod[index].TotalPrice = this.prod[index].Quantity * this.prod[index].UnitPrice;
            }
            let lOne = Number(this.prod[index].lOne);
            let flr = Number(this.prod[index].Floor_Price__c);
            let unitp = Number(this.prod[index].UnitPrice);
            this.handleWarning(targetId,lOne, flr, unitp, index )
        },500)
    }
//delete individual line items. 
    handleDelete(index){
        let id = this.prod[index].Id;

        if(index >= 0 ){
            let cf = confirm('Do you want to delete this line item')
            if(cf === true){
                this.prod.splice(index, 1);
                if(id){
                    deleteRecord(id);
                }
            }
            this.goodPricing = checkPricing(this.prod);
        }
    }
//Notes could maybe do something with onblur instead
    handleNote(evt){
        let index = this.prod.findIndex(prod => prod.Product2Id === evt.target.name);
        this.prod[index].Description = evt.detail.value; 
    }
    saveAndMove(){
        this.showSpinner = true; 
        console.log('in save '+ JSON.stringify(this.prod));

        const newProduct = this.prod.filter(x=>x.Id === '') 
        const alreadyThere = this.prod.filter(y=>y.Id != '')
        createProducts({olList: this.prod, oppId: this.oppId})
        .then(result => {
            let back = updateNewProducts(newProduct, result);
            this.prod =[...alreadyThere, ...back]; 
            this.backUp = this.prod; 
            this.total = this.orderTotal(this.prod)
            this.showProducts = false;
            this.shipAddress = true; 
            this.showSpinner = false; 
            alert('Products Saved')
        }).catch(error=>{
            alert(JSON.stringify(error))
           
        })
    } 

    saveMobile(){
        this.showSpinner = true; 
        console.log('in save '+ JSON.stringify(this.prod));

        const newProduct = this.prod.filter(x=>x.Id === '') 
        const alreadyThere = this.prod.filter(y=>y.Id != '')
        let shipTotal = this.prod.filter(y => y.ProductCode.includes('SHIPPING'));
        createProducts({olList: this.prod, oppId: this.oppId})
        .then(result => {
            let back = updateNewProducts(newProduct, result);
            this.prod =[...alreadyThere, ...back]; 
            this.backUp = this.prod; 
            this.total = this.orderTotal(this.prod)
            this.showSpinner = false; 
            alert('Products Saved!')
        }).then(()=>{
            if(shipTotal.length>0){
                console.log('saving shipping');
                let shipCharge = getShipping(shipTotal);
                
                const fields = {};
                fields[ID_FIELD.fieldApiName] = this.oppId;
                fields[SHIPCHARGE.fieldApiName] = shipCharge;
                const shipRec = {fields}
                updateRecord(shipRec)
            } 
         
        }).catch(error=>{
            alert(JSON.stringify(error))
           
        })
    } 

    saveSubmit(){
        this.showSpinner = true;
        createProducts({olList: this.prod, oppId:this.oppId})
        .then(result=>{
            this.stage = 'Closed Won';
            const stageChange = new FlowAttributeChangeEvent('stage', this.stage);
            const shipChange = new FlowAttributeChangeEvent('prevSelected', this.prevSelected);
            this.dispatchEvent(stageChange);
            this.dispatchEvent(shipChange);
            this.handleNext();
            this.showSpinner = false; 
    }).catch(error=>{
        let err = JSON.stringify(error);
        alert(err);
        this.showSpinner = false; 
    })
    }

    handleCancel(){
        let cf =confirm('Remove Changes?');
        if(cf === true){
            this.prod = [...this.backUp]; 
        }
    }
    //open close search for products
    openProducts(){
        // this.template.querySelector('c-mobile-search').openSearch();
        this.showProducts = false;
        this.addProducts = true; 
    }
    handleCloseSearch(){    
        this.showProducts = true; 
        this.addProducts = false; 
        this.prod = this.prod.reverse(); 
    }
    handleRemLast(y){
            let index = this.prod.findIndex(prod => prod.ProductCode === y.detail);  
            console.log(index);
             
            if(index > -1){
                this.prod.splice(index, 1);
            }else{
                return; 
            }    
    }
    //New product selected from mobile search
    //!!Unit Cost is Unit Price on pbe. That is the api name. 
    //The lable is list price. 
    handleNewProduct(prodx){
        this.productCode = prodx.detail.ProductCode;
        this.productName = prodx.detail.Name;
        this.productId = prodx.detail.Product2Id;
        this.pbeId = prodx.detail.Id;
        this.unitCost = prodx.detail.Product_Cost__c;
        this.agProduct = prodx.detail.agency;
        this.floorPrice = prodx.detail.Floor_Price__c;
        this.floorType = prodx.detail.Product2.Floor_Type__c;
        this.levelOne = prodx.detail.Level_1_UserView__c; 
        this.levelTwo = prodx.detail.Level_2_UserView__c;
        this.levelTwoMargin = prodx.detail.Level_2_Margin__c; 
        this.shipWeight = prodx.detail.Product2.Ship_Weight__c;
        this.palletConfig = prodx.detail.Product2.Pallet_Qty__c;
       // console.log('2 '+this.agProduct);
        
        //check if they already have it on the order. We can't have multiple same sku's on a bill
        let alreadyThere = this.prod.findIndex(prod => prod.ProductCode === this.productCode);
        //console.log('already there '+ alreadyThere)
        if(alreadyThere < 0){
            this.getPrevSale();
            this.wasEdited = true; 
        }else{
            return; 
        }
    }

    addShip(){
        const atsShip = {
            sObjectType: 'OpportunityLineItem',
            Id: '',
            PricebookEntryId: '01u2M00000ZBLn5QAH',
            Product2Id: '01t2M0000062XwhQAE',
            agency: false,
            name: 'ATS SHIPPING',
            ProductCode: 'ATS SHIPPING',
            Ship_Weight__c: 0,
            Quantity: 1,
            UnitPrice: 1.00,
            floorPrice: 0.00,
            lOne: 0.00,
            lTwo: 0.00, 
            CPQ_Margin__c: 0.00,
            Cost__c: 0.00,
            displayCost: 0.00,
            lastPaid: 'use report',
            lastMarg: 'use report',
            docDate: '',
            TotalPrice: 1.00,
            wInv:  0.00,
            showLastPaid: true,
            lastQuoteAmount: 0.00,
            lastQuoteMargin: 0.00,
            lastQuoteDate: 0.00,
            flrText: 'flr price $',
            lOneText: 'lev 1 $',
            companyLastPaid: 0.00,
            palletConfig: 0.00,
            //tips: this.agency ? 'Agency' : 'Cost: $'+this.unitCost +' Company Last Paid: $' +this.companyLastPaid + ' Code ' +this.productCode,
            goodPrice: true,
            manLine: false,
            url:`https://advancedturf.lightning.force.com/lightning/r/01t2M0000062XwhQAE/related/ProductItems/view`,
            OpportunityId: this.oppId
        }
        const atsShipNT = {
            sObjectType: 'OpportunityLineItem',
            Id: '',
            PricebookEntryId: '01u7500000BY6SaAAL',
            Product2Id: '01t75000000rTHPAA2',
            agency: false,
            name: 'ATS SHIPPING - SPLIT SHIPMENTS',
            ProductCode: 'ATS SHIPPING-SPLIT',
            Ship_Weight__c: 0,
            Quantity: 1,
            UnitPrice: 1.00,
            floorPrice: 0.00,
            lOne: 0.00,
            lTwo: 0.00, 
            CPQ_Margin__c: 0.00,
            Cost__c: 0.00,
            displayCost: 0.00,
            lastPaid: 'use report',
            lastMarg: 'use report',
            docDate: '',
            TotalPrice: 1.00,
            wInv:  0.00,
            showLastPaid: true,
            lastQuoteAmount: 0.00,
            lastQuoteMargin: 0.00,
            lastQuoteDate: 0.00,
            flrText: 'flr price $',
            lOneText: 'lev 1 $',
            companyLastPaid: 0.00,
            palletConfig: 0.00,
            //tips: this.agency ? 'Agency' : 'Cost: $'+this.unitCost +' Company Last Paid: $' +this.companyLastPaid + ' Code ' +this.productCode,
            goodPrice: true,
            manLine: false,
            url:`https://advancedturf.lightning.force.com/lightning/r/01t2M0000062XwhQAE/related/ProductItems/view`,
            OpportunityId: this.oppId
        }
        const checkShip = this.prod.findIndex(x => x.Product2Id === '01t2M0000062XwhQAE')
        const checkNT = this.prod.findIndex(x => x.Product2Id === '01t75000000rTHPAA2')
        console.log(1, checkShip, 2, checkNT)
        if(checkShip >= 0 && checkNT >=0 ){
            return; 
        }else if(checkShip < 0 && checkNT < 0){
            this.prod = [...this.prod, atsShip, atsShipNT]; 
        }else if(checkShip < 0 && checkNT >=0){
            this.prod = [...this.prod, atsShip ];
        }else if(checkShip >= 0 && checkNT < 0){
            this.prod = [...this.prod, atsShipNT ];
        }else{
            return; 
        }
    }
//ADDING NEW PRODUCT TO LIST
    async getPrevSale(){
    
        let newProd = await getLastPaid({accountID: this.accountId, Code: this.productCode})
        this.invCount = await getInventory({locId: this.warehouse, pId: this.productId })
        this.lastQuote = await getLastQuote({accountID: this.accountId, Code: this.productCode, opportunityId: this.oppId });

        if(newProd !=null){
            
            
            this.prod =[
                ...this.prod,{
                    sObjectType: 'OpportunityLineItem',
                    Id: '',
                    PricebookEntryId: this.pbeId,
                    Product2Id: this.productId,
                    name: this.productName,
                    Product_Name__c: this.productName,
                    ProductCode: this.productCode,
                    Quantity: 1,
                    UnitPrice:this.agProduct ? this.floorPrice: this.levelTwo,
                    lOne: this.agProduct ? this.floorPrice : this.levelOne,
                    lTwo: this.agProduct ? this.floorPrice : this.levelTwo,
                    CPQ_Margin__c: this.agProduct? 0 : this.levelTwoMargin,
                    Cost__c: this.unitCost,
                    displayCost: this.agProduct ? 'Agency' : this.unitCost,
                    prevPurchase: true,
                    lastPaid: newProd.Unit_Price__c,
                    lastMarg: this.agProduct ? '' : newProd.Margin__c,
                    lastPaidDate: newProd.Unit_Price__c ? '$'+newProd.Unit_Price__c +' '+newProd.Doc_Date__c : '',
                    TotalPrice: this.agProduct ? this.floorPrice: this.levelTwo,
                    Floor_Price__c: this.floorPrice,
                    Floor_Type__c: this.floorType,
                    Agency__c: this.agProduct,
                    palletConfig: this.palletConfig, 
                    Description: '', 
                    wInv:  !this.invCount ? 0 :this.invCount.Quantity_Available__c,
                    readOnly: this.agProduct ? true : false,
                    editQTY: false,
                    lastQuoteAmount: !this.lastQuote ? 0 : this.lastQuote.Last_Quote_Price__c + ' '+ this.lastQuote.Quote_Date__c,
                    lastQuoteMargin: !this.lastQuote ? 0 : this.lastQuote.Last_Quote_Margin__c,
                    Ship_Weight__c: this.shipWeight,
                    levels:'Lvl 1 $'+this.levelOne + ' Lvl 2 $'+ this.levelTwo,
                    goodPrice: true,
                    OpportunityId: this.oppId
                }
            ]
        }else{
            
            this.prod = [
                ...this.prod, {
                    sObjectType: 'OpportunityLineItem',
                    PricebookEntryId: this.pbeId,
                    Id: '',
                    Product2Id: this.productId,
                    name: this.productName,
                    Product_Name__c: this.productName,
                    ProductCode: this.productCode,
                    Quantity: 1,
                    UnitPrice: this.agProduct ? this.floorPrice : this.levelTwo,
                    lOne: this.agProduct ? this.unitCost : this.levelOne,
                    lTwo: this.agProduct ? this.unitCost : this.levelTwo,
                    prevPurchase: false,
                    lastPaid: 0,
                    lastMarg: this.agProduct ? 0: '', 
                    CPQ_Margin__c: this.agProduct? 0 : this.levelTwoMargin,
                    Cost__c: this.agProduct ? '': this.unitCost,
                    displayCost: this.agProduct ? 'Agency' : this.unitCost,
                    TotalPrice: this.agProduct ? this.floorPrice: this.levelTwo,
                    Floor_Price__c: this.floorPrice,
                    Floor_Type__c: this.floorType,
                    Agency__c: this.agProduct,
                    palletConfig: this.palletConfig,
                    Description: '',
                    wInv:  !this.invCount ? 0 :this.invCount.Quantity_Available__c,
                    readOnly: this.agProduct ? true : false,
                    editQTY: false,
                    lastQuoteAmount: !this.lastQuote ? 0 : this.lastQuote.Last_Quote_Price__c + ' '+ this.lastQuote.Quote_Date__c,
                    lastQuoteMargin: !this.lastQuote ? 0 : this.lastQuote.Last_Quote_Margin__c,
                    Ship_Weight__c: this.shipWeight,
                    levels:'Lvl 1 $'+this.levelOne + ' Lvl 2 $'+ this.levelTwo,
                    goodPrice: true,
                    OpportunityId: this.oppId
                }
            ]
        } //console.log('new product '+JSON.stringify(this.prod))
    }
//handle show the save button options
allowSave(){
    if(!this.wasEdited){
        this.wasEdited = true; 
    }
}

     //PRICE WARNING SECTION 
        //handles showing the user prompts
        handleWarning = (targ, lev, floor, price,ind)=>{
            console.log(1, targ, 2, lev, 3, floor, 4, price);
             
             if(price > lev){
                 this.template.querySelector(`[data-id="${targ}"]`).style.color ="black";
                 this.template.querySelector(`[data-target-id="${targ}"]`).style.color ="black";
                 this.prod[ind].goodPrice = true; 
                 this.goodPricing = checkPricing(this.prod);
             }else if(price<lev && price>=floor){
                 this.template.querySelector(`[data-id="${targ}"]`).style.color ="orange";
                 this.template.querySelector(`[data-target-id="${targ}"]`).style.color ="orange";
                 this.prod[ind].goodPrice = true; 
                 this.goodPricing = checkPricing(this.prod);
                 this.wasEdited = true; 
             }else if(price===lev && price>=floor){
                 console.log('should be good')
                this.template.querySelector(`[data-id="${targ}"]`).style.color ="black";
                this.template.querySelector(`[data-target-id="${targ}"]`).style.color ="black";
                this.prod[ind].goodPrice = true;
                this.goodPricing = checkPricing(this.prod);
                this.wasEdited = true; 
            }else if(price<floor){
                 this.template.querySelector(`[data-id="${targ}"]`).style.color ="red";
                 this.template.querySelector(`[data-target-id="${targ}"]`).style.color ="red";
                 this.prod[ind].goodPrice = false;
                 this.goodPricing = checkPricing(this.prod);
                 this.wasEdited = false; 
             }
         }
     //init will check pricing and render the color 
     //should only run on load. Then handleWarning function above runs because it only runs over the individual line
     initPriceCheck(){
         this.hasRendered = false; 
         
             for(let i=0; i<this.prod.length; i++){
                 let target = this.prod[i].Product2Id
                 let level = Number(this.prod[i].lOne);
                 let floor = Number(this.prod[i].Floor_Price__c);
                 let price = Number(this.prod[i].UnitPrice);
                // console.log(i);
                 
                 //console.log('target '+target+' level '+level+' cost '+cost+' price '+price)
                 if(price>level){
                     this.template.querySelector(`[data-id="${target}"]`).style.color ="black";
                     this.template.querySelector(`[data-target-id="${target}"]`).style.color ="black";
                 }else if(price<level && price>=floor){
                     this.template.querySelector(`[data-id="${target}"]`).style.color ="orange";
                     this.template.querySelector(`[data-target-id="${target}"]`).style.color ="orange";
                 }else if(price===level && price>=floor){
                    this.template.querySelector(`[data-id="${target}"]`).style.color ="black";
                    this.template.querySelector(`[data-target-id="${target}"]`).style.color ="black";                    
                }else if(price<floor){
                     this.template.querySelector(`[data-id="${target}"]`).style.color ="red";
                     this.template.querySelector(`[data-target-id="${target}"]`).style.color ="red"
                     this.goodPricing = false;
                 }else{
                    //console.log('something is wrong '+ this.prod[i].Product2Id);
                     
                 }
             }   
     } 
     orderTotal(products){
        const sum = products.reduce(function(a,b){
            return Number(a) + Number(b.TotalPrice);
        },0)
        return sum; 
    }

    //warehouse information
    get warehouseOptions(){
        
        return [
            {label:'All', value:'All'},
            {label: '105 | Noblesville', value:'1312M000000PB0ZQAW'}, 
            {label:'115 | ATS Fishers', value:'1312M00000001nsQAA'},
            {label:'125 | ATS Lebanon (Parts)', value:'1312M00000001ntQAA'},
            {label:'200 | ATS Louisville', value:'1312M00000001nuQAA'},
            {label:'250 | ATS Florence', value:'1312M00000001nvQAA'},
            {label:'270 | ATS Winston-Salem', value:'1312M00000001nwQAA'},
            {label:'310 | ATS Tomball', value:'1312M000000PB6AQAW'},
            {label:'360 | ATS Nashville', value:'1312M00000001nxQAA'},
            {label:'400 | ATS Columbus', value:'1312M00000001nyQAA'},
            {label:'415 | ATS Sharonville', value:'1312M00000001nzQAA'},
            {label:'440 | ATS Lewis Center', value:'1312M00000001o0QAA'},
            {label:'450 | ATS Brecksville', value:'1312M00000001o1QAA'},
            {label:'470 | ATS Boardman', value:'1312M00000001o2QAA'},
            {label:'510 | ATS Travis City', value:'1312M00000001o3QAA'},
            {label:'520 | ATS Farmington Hills', value:'1312M00000001o4QAA'},
            {label:'600 | ATS - Elkhart', value:'1312M00000001o5QAA'},
            {label:'710 | ATS - St. Peters', value:'1312M00000001o6QAA'},
            {label:'720 | ATS - Cape Girardeau', value:'1312M00000001o7QAA'},
            {label:'730 | ATS - Columbia', value:'1312M00000001o8QAA'},
            {label:'770 | ATS - Riverside', value:'1312M00000001o9QAA'},
            {label:'790 | ATS - Springfield', value:'1312M0000004D7IQAU'},
            {label:'820 | ATS - Wheeling', value:'13175000000L3CnAAK'},
            {label:'850 | ATS - Madison', value:'1312M00000001oAQAQ'},
            {label:'860 | ATS - East Peoria', value:'1312M000000PB2BQAW'},
            {label:'960 | ATS - Monroeville', value:'1312M00000001oBQAQ'},
            {label:'980 | ATS - Ashland', value:'1312M00000001oCQAQ'}

        ];
    }
    //on load get warehouse value
    get selectedObj(){
        let label;
            if(this.warehouseOptions && this.warehouse){
                label = this.warehouseOptions.find((x)=>x.value===this.warehouse)
            }
            
            return label;   
    }
    async selectChange(evt){
        let newWarehouse = this.template.querySelector('.slds-select').value;
        
        //this.showProducts = false;
        this.showSpinner = true;
        let data = [...this.prod];
        let pcSet = new Set();
        let prodCodes = [];
        try{ 
            data.forEach(x=>{
                pcSet.add(x.ProductCode);
            })
            prodCodes = [...pcSet];
            //console.log(2, prodCodes)
            let getInventory= await inCounts({pc:prodCodes, locId:newWarehouse});
            //console.log(JSON.stringify(getInventory))
            this.prod = newWarehouse === "All" ? await allInventory(data , getInventory) : await newInventory(data, getInventory);
           // this.showProducts = true;
            this.showSpinner = false;
            this.hasRendered = true; 
            console.log('new inventory');
            
            console.log(JSON.stringify(this.prod))
         
        }catch(error){
            console.log(JSON.stringify('errors -> '+error))
        }
    }
}