//Goes with prodSeach!!!!!
//has to be a way to call apex on the new products selected here
import { LightningElement, api, wire, track } from 'lwc';
import getLastPaid from '@salesforce/apex/cpqApex.getLastPaid'; 
import getProducts from '@salesforce/apex/cpqApex.getProducts';
import getInventory from '@salesforce/apex/cpqApex.getInventory';
import onLoadGetInventory from '@salesforce/apex/cpqApex.onLoadGetInventory';
import onLoadGetLastPaid from '@salesforce/apex/cpqApex.onLoadGetLastPaid';
import onLoadGetLevels from '@salesforce/apex/cpqApex.getLevelPricing';
import inCounts from '@salesforce/apex/cpqApex.inCounts';
import { ShowToastEvent } from 'lightning/platformShowToastEvent';
import { APPLICATION_SCOPE,MessageContext, publish, subscribe,  unsubscribe} from 'lightning/messageService';
import Opportunity_Builder from '@salesforce/messageChannel/Opportunity_Builder__c';
import createProducts from '@salesforce/apex/cpqApex.createProducts';
import {getRecord, getFieldValue} from 'lightning/uiRecordApi';
import { deleteRecord } from 'lightning/uiRecordApi';
import ACC from '@salesforce/schema/Opportunity.AccountId';
import STAGE from '@salesforce/schema/Opportunity.StageName';
import PRICE_BOOK from '@salesforce/schema/Opportunity.Pricebook2Id'; 
import WAREHOUSE from '@salesforce/schema/Opportunity.Warehouse__c'
import {mergeInv,mergeLastPaid, lineTotal, onLoadProducts , newInventory, handleWarning} from 'c/helper'
const FIELDS = [ACC, STAGE, WAREHOUSE];
export default class ProdSelected extends LightningElement {
    @api recordId;
    pbeId; 
    productId; 
    productCode;
    pbId;
    unitCost;
    levelOne; 
    levelTwo; 
    agency
    sId; 
    productName; 
    prodFound = false
    accountId;
    stage;
    warehouse;
    invCount;
    error;
    goodPricing = true;   
    hasRendered = true; 
    loaded = true; 
    @track selection = []
//for message service
    subscritption = null;

    @wire(MessageContext)
    messageContext;
    // Standard lifecycle hooks used to subscribe and unsubsubscribe to the message channel
    connectedCallback() {
        this.subscribeToMessageChannel();
        this.loadProducts(); 
        
    }
    renderedCallback(){
        this.initPriceCheck();
    }
    disconnectedCallback() {
        this.unsubscribeToMessageChannel();
    }
    //subscribe to channel
    subscribeToMessageChannel(){
        
        if(!this.subscritption){
            this.subscritption = subscribe(
                this.messageContext,
                Opportunity_Builder,
                (message) => this.handleMessage(message),
                {scope:APPLICATION_SCOPE}
            );
        }
    }
    
    handleMessage(mess){
        this.productCode = mess.productCode;
        let alreadyThere = this.selection.findIndex(prod => prod.ProductCode === this.productCode);
        
        //check if the product is already on the bill. Can't have duplicates
        if(alreadyThere<0){
            this.productName = mess.productName;
            this.productId = mess.productId 
            this.pbeId = mess.pbeId;
            this.unitCost = mess.unitPrice;
            this.agency = mess.agencyProduct;
            this.levelOne = mess.levelOnePrice;
            this.levelTwo = mess.levelTwoPrice;  
            this.handleNewProd(); 
            this.prodFound = true;
        }    
    }
    unsubscribeToMessageChannel() {
        unsubscribe(this.subscription);
        this.subscription = null;
    }
//get record values
    @wire(getRecord, {recordId: '$recordId', fields:[ACC, STAGE, PRICE_BOOK, WAREHOUSE]})
        loadFields({data, error}){
            if(data){
                this.accountId = getFieldValue(data, ACC);
                this.stage = getFieldValue(data, STAGE);
                this.pbId = getFieldValue(data, PRICE_BOOK); 
                this.warehouse = getFieldValue(data, WAREHOUSE); 
                console.log('on load warehouse '+this.warehouse);
                
            }else if(error){
                console.log('error '+JSON.stringify(error));
                
            }
        }
    async handleNewProd(){
        //get last paid only works on new adding product
        this.newProd = await getLastPaid({accountID: this.accountId, Code: this.productCode})
        this.invCount = await getInventory({locId: this.warehouse, pId: this.productId })
        
        if(this.newProd != null){

            this.selection = [
                ...this.selection, {
                    sObjectType: 'OpportunityLineItem',
                    Id: '',
                    PricebookEntryId: this.pbeId,
                    Product2Id: this.productId,
                    agency: this.agency,
                    name: this.productName,
                    ProductCode: this.productCode,
                    Quantity: 1,
                    UnitPrice: this.agency ? this.unitCost: this.levelTwo,
                    lOne: this.agency? this.unitCost : this.levelOne,
                    lTwo: this.levelTwo, 
                    CPQ_Margin__c: this.agency?'':0,
                    Cost__c: this.unitCost,
                    lastPaid: !this.newProd ? 0 : this.newProd.Unit_Price__c,
                    lastMarg: this.agency ? '' : (this.newProd.Margin__c / 100),
                    docDate: this.newProd.Doc_Date__c,
                    TotalPrice: this.agency? this.unitCost : this.levelOne,
                    wInv:  !this.invCount ? 0 :this.invCount.QuantityOnHand,
                    OpportunityId: this.recordId
                }
            ]
        }else{
            this.selection = [
                ...this.selection, {
                    sObjectType: 'OpportunityLineItem',
                    PricebookEntryId: this.pbeId,
                    Id: undefined,
                    Product2Id: this.productId,
                    agency: this.agency,
                    name: this.productName,
                    ProductCode: this.productCode,
                    Quantity: 1,
                    UnitPrice: this.agency ? this.unitCost: this.levelTwo,
                    lOne: this.agency? this.unitCost : this.levelOne,
                    lTwo: this.levelTwo,
                    lastPaid: 0,
                    lastMarg: 0,  
                    CPQ_Margin__c: this.agency?'':0,
                    Cost__c: this.unitCost,
                    TotalPrice: this.agency? this.unitCost : this.levelOne,
                    wInv: !this.invCount ? 0 :this.invCount.QuantityOnHand,
                    OpportunityId: this.recordId
                }
            ]
        }    
         
    }

    //If a user decides to uncheck a product on the search screen
    handleRemove(y){
        console.log('handleRemove');
        let index = this.selection.findIndex(prod => prod.PricebookEntryId === y.detail);
        
        if(index > -1){
            this.selection.splice(index, 1);
        }else{
            return; 
        }   
    }

    //Handle Pricing change here
    newPrice(e){
        window.clearTimeout(this.delay);
        let index = this.selection.findIndex(prod => prod.ProductCode === e.target.name)
        //let targetId = this.selection.find(ele => ele.ProductCode === e.target.name);
        let targetId = e.target.name; 
        
        
        this.delay = setTimeout(()=>{
            this.selection[index].UnitPrice = e.detail.value;
            this.selection[index].UnitPrice = Number(this.selection[index].UnitPrice);
            
            if(this.selection[index].UnitPrice > 0){
                this.selection[index].CPQ_Margin__c = Number((1 - (this.selection[index].Cost__c /this.selection[index].UnitPrice))*100).toFixed(2)
                this.selection[index].TotalPrice = (this.selection[index].Quantity * this.selection[index].UnitPrice).toFixed(2);    

            }
            //Alert the user if the pricing is good. If an item is below floor don't allow a save. Could push that item to special order
            let lOne = Number(this.selection[index].lOne);
            let cst = Number(this.selection[index].Cost__c);
            let unitp = Number(this.selection[index].UnitPrice);
            this.handleWarning(targetId,lOne, cst, unitp )

        }, 1000)
    }
    

    newMargin(m){
        window.clearTimeout(this.delay)
        let index = this.selection.findIndex(prod => prod.ProductCode === m.target.name)
        let targetId = m.target.name; 
        
        // eslint-disable-next-line @lwc/lwc/no-async-operation
        this.delay = setTimeout(()=>{
                this.selection[index].CPQ_Margin__c = Number(m.detail.value);
                console.log('new margin value '+this.selection[index].CPQ_Margin__c)
                console.log('type of '+ typeof this.selection[index].CPQ_Margin__c );
                
                if(1- this.selection[index].CPQ_Margin__c/100 > 0){
                    this.selection[index].UnitPrice = Number(this.selection[index].Cost__c /(1- this.selection[index].CPQ_Margin__c/100)).toFixed(2);
                    console.log('cost '+this.selection[index].Cost__c);
                    
                    console.log('margin cal '+(1- this.selection[index].CPQ_Margin__c/100))
                    
                    this.selection[index].TotalPrice = Number(this.selection[index].Units_Required__c * this.selection[index].UnitPrice).toFixed(2)
                    this.selection[index].TotalPrice = lineTotal(this.selection[index].Quantity, this.selection[index].UnitPrice);                
                }else{
                    this.selection[index].UnitPrice = 0;
                    this.selection[index].UnitPrice = this.selection[index].UnitPrice.toFixed(2);
                    this.selection[index].TotalPrice = Number(this.selection[index].Units_Required__c * this.selection[index].UnitPrice).toFixed(2)   
                 
                }
                //Alert the user if the pricing is good. If an item is below floor don't allow a save. Could push that item to special order
            let lOne = Number(this.selection[index].lOne);
            let cst = Number(this.selection[index].Cost__c);
            let unitp =  Number(this.selection[index].UnitPrice);
            
            this.handleWarning(targetId,lOne, cst, unitp )
    },1000)
        
    }
    
    newQTY(e){
        let index = this.selection.findIndex(prod => prod.ProductCode === e.target.name)
        console.log('index '+index);
        
        this.selection[index].Quantity = Number(e.detail.value);
        if(this.selection[index].UnitPrice >0){
            this.selection[index].TotalPrice = (this.selection[index].Quantity * this.selection[index].UnitPrice).toFixed(2); 
            console.log('qty change '+this.selection[index].TotalPrice);
            
        }
    }
    newComment(x){
        let index = this.selection.findIndex(prod => prod.ProductCode === x.target.name);
        this.selection[index].Description = x.detail.value;    
    }
    
    removeProd(x){
        let index = this.selection.findIndex(prod => prod.ProductCode === x.target.name)
        let id = this.selection[index].Id; 
        
        if(index >= 0){
            let cf = confirm('Do you want to remove this entry?')
            if(cf ===true){
                this.selection.splice(index, 1);
                if(id != undefined){
                    console.log('deleting prod');
                    
                    deleteRecord(id); 
                }
            }
        }      
    }
    //get warehouse options
//these are hardcoded to full NEED TO GET DYNAMIC
    get warehouseOptions(){
        return [
            {label:'115 | ATS Fishers', value:'1311D0000001NOaQAM'},
            {label:'200 | ATS Louisville', value:'1311D0000001O7TQAU'},
            {label:'400 | ATS Columbus', value:'1311D0000001O7OQAU'},
            {label:'600 | ATS - Elkhart', value:'1311D0000001O7JQAU'},
        ];
    }
    //check other inventory
    async checkInventory(locId){
        this.warehouse = locId.detail.value; 
        this.loaded = false;
        let data = [...this.selection];
        let pcSet = new Set();
        let prodCodes = [];
        try{
            data.forEach(x=>{
                pcSet.add(x.ProductCode);
            })
            prodCodes = [...pcSet];

            let inCheck = await inCounts({pc:prodCodes, locId:this.warehouse});
            console.log('inCheck ' +JSON.stringify(inCheck));
            this.selection = await newInventory(data, inCheck);
            //console.log(JSON.stringify(this.selection)); 
        }catch(error){
            this.error = error;
            const evt = new ShowToastEvent({
                title: 'Error loading inventory',
                message: this.error,
                variant: 'warning'
            });
            this.dispatchEvent(evt);
        }finally{
            this.loaded = true;
        }    
    }

    //Save Products
    saveProducts(){
        this.loaded = false; 
        console.log('sending '+JSON.stringify(this.selection))
        createProducts({olList: this.selection})
        .then(result=>{
            this.dispatchEvent(
                new ShowToastEvent({
                    title: result,
                    message: 'Products Saved',
                    variant: 'success',
                }),
            );
        }).catch(error=>{
            console.log(JSON.stringify(error))
            let message = 'Unknown error';
            if (Array.isArray(error.body)) {
                message = error.body.map(e => e.message).join(', ');
            } else if (typeof error.body.message === 'string') {
                message = error.body.message;
            }
            this.dispatchEvent(
                new ShowToastEvent({
                    title: 'Error Saving Products',
                    message,
                    variant: 'error',
                }),
            );
        }).finally(()=>{
            this.loaded = true; 
        })
    }

;
    //on load get products
    //get last paid next
    async loadProducts(){
        //inventory vars
        let inSet = new Set();
        let prodIdInv = []; 
        let inCode = new Set();
        let codes = [];
        try{
            let results = await getProducts({oppId: this.recordId})
            if(!results){
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
            this.selection = await onLoadProducts(mergedLevels, this.recordId); 
                console.log('selection '+JSON.stringify(this.selection));
            // mergedLastPaid.forEach(x=> 
            //     console.log('Product: '+x.Product2.Name+' doc name '+x.Name+' doc date '+x.Doc_Date__c)
            // )
            
         }catch(error){
            let mess = error; 
            console.log('error ==> '+error);
            
            this.dispatchEvent(
                new ShowToastEvent({
                    title: 'Error loading products',
                    message: mess,
                    variant: 'error',
                }),
            );
            
        }finally{
            this.prodFound = true; 
        }

    }
    //handles alerting the user if the pricing is good or bad 
    handleWarning = (targ, lev, cost, price)=>{
        if(price > lev){
            this.template.querySelector(`[data-id="${targ}"]`).style.color ="black";
            this.template.querySelector(`[data-target-id="${targ}"]`).style.color ="black";
            this.goodPricing = true; 
        }else if(price<lev && price>cost){
            this.template.querySelector(`[data-id="${targ}"]`).style.color ="orange";
            this.template.querySelector(`[data-target-id="${targ}"]`).style.color ="orange";
            this.goodPricing = true;
        }else if(price<cost){
            this.template.querySelector(`[data-id="${targ}"]`).style.color ="red";
            this.template.querySelector(`[data-target-id="${targ}"]`).style.color ="red";
            this.goodPricing = false;
        }
    }
    initPriceCheck(){
        console.log('hasRendered '+this.hasRendered);
        
        if(this.selection){
            for(let i=0; i<this.selection.length; i++){
                let target = this.selection[i].ProductCode
                let level = Number(this.selection[i].lOne);
                let cost = Number(this.selection[i].Cost__c);
                let price = Number(this.selection[i].UnitPrice);
                if(price>level){
                    console.log('good to go '+this.selection[i].name);
                    this.template.querySelector(`[data-id="${target}"]`).style.color ="black";
                }else if(price<level && price>cost){
                    console.log('warn '+this.selection[i].name);
                    this.template.querySelector(`[data-id="${target}"]`).style.color ="orange";
                }else if(price<cost){
                    console.log('bad pricing '+this.selection[i].name);
                    this.template.querySelector(`[data-id="${target}"]`).style.color ="red";
                    this.goodPricing = false;
                }
            }
             
        }
        
        
    }
    //open price book search
    openProdSearch(){
        this.template.querySelector('c-prod-search').openPriceScreen(); 
    }
}