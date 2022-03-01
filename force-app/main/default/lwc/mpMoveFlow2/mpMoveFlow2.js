import { LightningElement,api, track } from 'lwc';
import createProducts from '@salesforce/apex/cpqApex.createProducts';
import getLastPaid from '@salesforce/apex/cpqApex.getLastPaid'; 
import getInventory from '@salesforce/apex/cpqApex.getInventory';
import onLoadGetInventory from '@salesforce/apex/cpqApex.onLoadGetInventory';
import getProducts from '@salesforce/apex/cpqApex.getProducts';
import onLoadGetLastPaid from '@salesforce/apex/cpqApex.onLoadGetLastPaid';
import onLoadGetLevels from '@salesforce/apex/cpqApex.getLevelPricing';
import {mergeInv,mergeLastPaid, lineTotal, onLoadProducts , newInventory, handleWarning,getTotals, roundNum,totalChange} from 'c/mh2'
import { FlowNavigationNextEvent,FlowAttributeChangeEvent, FlowNavigationBackEvent  } from 'lightning/flowSupport';
export default class MpMoveFlow2 extends LightningElement {
    @api oppId;
    @api warehouse;
    @api accountId; 
    @api pbId; 
    @api prevSelected;
    @api 
    get addresses(){
        return this.shipOptions || [];
    }
    set addresses(data){
        this.shipOptions = data; 
    }
    shipOptions;
    showDelete = false;  
    addProducts = false;
    shipAddress = false; 
    showProducts=true; 
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
    shipWeight;
    total; 
    connectedCallback() {
        this.loadProducts(); 
        
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
            let results = await getProducts({oppId: this.oppId})
            console.log(results);
            
            if(!results){
                console.log('should stop')
                this.showSpinner = false;
                return; 
            }else if(results){

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
            //console.log('lp '+JSON.stringify(lastPaid));
            
            let priceLevels = await onLoadGetLevels({priceBookId: this.pbId, productIds:prodIdInv})
            
            //MERGE the inventory and saved products. 
            let mergedInven = await mergeInv(results,invenCheck);
            //merge last paid saved products
            let mergedLastPaid = await mergeLastPaid(mergedInven,lastPaid);            
            //MERGE the price levels and saved products
            let mergedLevels = await mergeInv(mergedLastPaid, priceLevels);
            
            
            //IF THERE IS A PROBLEM NEED TO HANDLE THAT STILL!!!
            this.prod = await onLoadProducts(mergedLevels, this.recordId); 
            console.log(JSON.stringify(this.prod))
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
            
            this.handleWarning(targetId,lOne, flr, unitp );
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
            this.handleWarning(targetId,lOne, flr, unitp )
        },500)
    }
//delete individual line items. 
    handleDelete(index){
        let id = this.prod[index].Id;
        if(index>-1){
            let cf = confirm('Do you want to delete this line item')
            if(cf === true){
                this.prod.splice(index, 1);
            }if(id){
                deleteRecord(id);
            }
        }
    }
//Notes could maybe do something with onblur instead
    handleNote(evt){
        let index = this.prod.findIndex(prod => prod.Product2Id === evt.target.name);
        this.prod[index].Description = evt.detail.value; 
    }
    saveMobile(){
        this.showSpinner = true; 
        //let data = [...this.prod];
        console.log('in save '+ JSON.stringify(this.prod))
        createProducts({olList: this.prod})
        .then(result => {
            this.showSpinner = false; 
            
            //un comment this if you want to move the flow screen to a next action
            let mess = result;
           // console.log(mess);
           this.total = this.orderTotal(this.prod)
            this.showProducts = false;
            this.shipAddress = true; 
            
        }).catch(error=>{
            console.log(JSON.stringify(error))
            let message = 'Unknown error';
            if (Array.isArray(error.body)) {
                message = error.body.map(e => e.message).join(', ');
            } else if (typeof error.body.message === 'string') {
                message = error.body.message;
            }
        })
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
//ADDING NEW PRODUCT TO LIST
    async getPrevSale(){
        let newProd = await getLastPaid({accountID: this.accId, Code: this.productCode})
        this.invCount = await getInventory({locId: this.whId, pId: this.productId })
        
        
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
                    prevPurchase: true,
                    lastPaid: newProd.Unit_Price__c,
                    lastMarg: this.agProduct ? '' : newProd.Margin__c,
                    lastPaidDate: newProd.Unit_Price__c ? '$'+newProd.Unit_Price__c +' '+newProd.Doc_Date__c : '',
                    TotalPrice: this.agProduct ? this.floorPrice: this.levelTwo,
                    Floor_Price__c: this.floorPrice,
                    Floor_Type__c: this.floorType,
                    Agency__c: this.agProduct,
                    Description: '', 
                    wInv:  !this.invCount ? 0 :this.invCount.QuantityOnHand,
                    readOnly: this.agProduct ? true : false,
                    editQTY: false,
                    Ship_Weight__c: this.shipWeight,
                    levels: 'Lvl 1 $'+this.levelOne +' Lvl 2 $'+this.levelTwo,
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
                    Cost__c: this.unitCost,
                    TotalPrice: this.agProduct ? this.floorPrice: this.levelTwo,
                    Floor_Price__c: this.floorPrice,
                    Floor_Type__c: this.floorType,
                    Agency__c: this.agProduct,
                    Description: '',
                    wInv:  !this.invCount ? 0 :this.invCount.QuantityOnHand,
                    readOnly: this.agProduct ? true : false,
                    editQTY: false,
                    Ship_Weight__c: this.shipWeight,
                    levels: 'Lvl 1 $'+this.levelOne +' Lvl 2 $'+this.levelTwo,
                    OpportunityId: this.oppId
                }
            ]
        } console.log('new product '+JSON.stringify(this.prod))
    }
//handle show the save button options
allowSave(){
    if(!this.wasEdited){
        this.wasEdited = true; 
    }
}

     //PRICE WARNING SECTION 
        //handles showing the user prompts
        handleWarning = (targ, lev, floor, price)=>{
            console.log(1, targ, 2, lev, 3, floor, 4, price);
             
             if(price > lev){
                 this.template.querySelector(`[data-id="${targ}"]`).style.color ="black";
                 this.template.querySelector(`[data-target-id="${targ}"]`).style.color ="black";
                 this.goodPricing = true;
                 this.wasEdited = true; 
             }else if(price<lev && price>floor){
                 this.template.querySelector(`[data-id="${targ}"]`).style.color ="orange";
                 this.template.querySelector(`[data-target-id="${targ}"]`).style.color ="orange";
                 this.goodPricing = true;
                 this.wasEdited = true; 
             }else if(price<floor){
                 this.template.querySelector(`[data-id="${targ}"]`).style.color ="red";
                 this.template.querySelector(`[data-target-id="${targ}"]`).style.color ="red";
                 this.goodPricing = false;
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
                 let cost = Number(this.prod[i].Cost__c);
                 let price = Number(this.prod[i].UnitPrice);
                // console.log(i);
                 
                 //console.log('target '+target+' level '+level+' cost '+cost+' price '+price)
                 if(price>level){
                     this.template.querySelector(`[data-id="${target}"]`).style.color ="black";
                     this.template.querySelector(`[data-target-id="${target}"]`).style.color ="black";
                 }else if(price<level && price>cost){
                     this.template.querySelector(`[data-id="${target}"]`).style.color ="orange";
                     this.template.querySelector(`[data-target-id="${target}"]`).style.color ="orange";
                 }else if(price<cost){
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

    handleShipping(x){
        console.log('i am listening');
        
        console.log(x.detail)
    }
    handleNext(){
        const nextNav = new FlowNavigationNextEvent();
        try{
            this.dispatchEvent(nextNav);

        }catch{
            console.log('break');
            
        }
    }
}