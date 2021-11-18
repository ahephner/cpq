import { deleteRecord } from 'lightning/uiRecordApi';
import { LightningElement, api, track } from 'lwc';
import createProducts from '@salesforce/apex/cpqApex.createProducts';
import getLastPaid from '@salesforce/apex/cpqApex.getLastPaid'; 
import { FlowNavigationNextEvent,FlowAttributeChangeEvent, FlowNavigationBackEvent  } from 'lightning/flowSupport';

export default class MobileProducts extends LightningElement {
    showDelete = false;  
    addProducts = false;
    wasEdited = false;  
    @track prod = [] 
    @api backUp = [];
    @api results; 
    @api oppId; 
    @api totalPrice;
    recId;
    prodData; 
    showSpinner = true;
    productCode;
    productName;
    productId;
    pbeId;
    unitCost;
    agProduct;
    floorType;
    floorPrice; 
    //minimum amount of units per line item
    minUnits = 1
    //on screen load
    connectedCallback(){
        this.showSpinner = false; 
        //console.log('load '+this.oppId)
    }
    //get products passed in from the flow
    @api 
    get products(){
        return this.prodData || [];
    } 
//setting products from passed in from the flow
    set products(data){
        this.prodData = data; 
        this.load(this.prodData);        
    }

    load(p){
        let readOnly
        let editQTY; 
        let icon
        let showInfo 
        this.prod =  p.map(x=>{
            readOnly = true;
            showInfo = false;  
            editQTY = true; 
            icon = 'utility:edit'
            return {...x, readOnly, icon, showInfo, editQTY}
        })
        this.backUp = [...this.prod]
        this.showSpinner = false; 
       // console.log(JSON.stringify(this.prod))        
    }

    handleAction(e){
        let action = e.detail.value
        let index = this.prod.findIndex(x => x.Id === e.target.name)
        
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

       info(index){
           if(this.prod[index].showInfo === true){
            this.prod[index].showInfo = false;
           }else{
            this.prod[index].showInfo = true; 
           }
       }
    // edit(e){
    //     let index = this.prod.findIndex(x=>x.Id === e.target.name)
    //     //need to do more in here like show a delete button.
    //     if(this.prod[index].icon === 'utility:edit'){
    //         this.prod[index].icon = 'utility:close';
    //         this.prod[index].readOnly = false;
    //         this.prod[index].buttonGroup = true
    //     } else{
    //         this.prod[index].icon = 'utility:edit';
    //         this.prod[index].readOnly = true;
    //         this.prod[index].buttonGroup = false; 
    //     }
    // }

    //Handle value changes
    handleQty(qty){
        this.allowSave();
        let index = this.prod.findIndex(prod => prod.Id === qty.target.name);
        this.prod[index].Quantity = Number(qty.detail.value);
        //handle total price change
        if(this.prod[index].UnitPrice > 0){
            this.prod[index].TotalPrice = this.prod[index].Quantity * this.prod[index].UnitPrice; 
        }
    }

    handlePrice(p){
        this.allowSave();
        window.clearTimeout(this.delay);
        let index = this.prod.findIndex(prod => prod.Id === p.target.name);
        this.delay = setTimeout(()=>{
            this.prod[index].UnitPrice = Number(p.detail.value);
            if(this.prod[index].UnitPrice > 0){
                this.prod[index].CPQ_Margin__c = Number((1-(this.prod[index].Cost__c /this.prod[index].UnitPrice))*100).toFixed(2)
                this.prod[index].TotalPrice = this.prod[index].Quantity * this.prod[index].UnitPrice;
            }
        },500)
    }

    handleMargin(m){
        //window.clearTimeout(this.delay)
        this.allowSave();
        let index = this.prod.findIndex(prod => prod.Id === m.target.name);
        console.log('index '+index);
        
        this.delay = setTimeout(()=>{
            this.prod[index].CPQ_Margin__c = Number(m.detail.value);
            let cost = this.prod[index].Cost__c;
            let num = (1- this.prod[index].CPQ_Margin__c/100)
            if(num > 0){
                this.prod[index].UnitPrice = (cost/num).toFixed(2);
                this.prod[index].TotalPrice = this.prod[index].Quantity * this.prod[index].UnitPrice;
            }
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
//save products
    saveMobile(){
        this.showSpinner = true; 
        let data = [...this.prod];
        console.log('in save '+ data)
        createProducts({olList: this.prod})
        .then(result => {
            this.showSpinner = false; 
            let total = this.orderTotal(this.prod);
            //un comment this if you want to move the flow screen to a next action
            let mess = result;
            const attChange = new FlowAttributeChangeEvent('totalPrice', total);
            this.dispatchEvent(attChange); 
            const attributeChange = new FlowAttributeChangeEvent('results', mess);
            this.dispatchEvent(attributeChange);
            this.handleNext(); 
        }).catch(error=>{
            console.log(JSON.stringify(error))
            let message = 'Unknown error';
            if (Array.isArray(error.body)) {
                message = error.body.map(e => e.message).join(', ');
            } else if (typeof error.body.message === 'string') {
                message = error.body.message;
            }
            //un comment this if you want to move the flow screen to a next action
            const attributeChangeBad = new FlowAttributeChangeEvent('results', message);
            this.dispatchEvent(attributeChangeBad);
            this.handleNext(); 
        })
    }
//cancel set values back the original
    handleCancel(){
        this.prod = this.backUp;
        this.wasEdited = false; 
    }

    handleNext(){
        const nextNav = new FlowNavigationNextEvent();
        this.dispatchEvent(nextNav);
    }

    openProducts(){
        // this.template.querySelector('c-mobile-search').openSearch();
        this.addProducts = true; 
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
    handleNewProduct(prod){
        this.productCode = prod.detail.ProductCode;
        this.productName = prod.detail.Name;
        this.productId = prod.detail.Product2Id;
        this.pbeId = prod.detail.Id;
        this.unitCost = prod.detail.UnitPrice;
        this.agProduct = prod.detail.agency;
        this.floorPrice = prod.detail.Product2.Floor_Price__c;
        this.floorType = prod.detail.Product2.Floor_Type__c;
        console.log(this.floorType);
        
        //check if they already have it on the order
        let alreadyThere = this.prod.findIndex(prod => prod.ProductCode === this.productCode);
        if(alreadyThere < 0){
            this.getPrevSale();
            this.wasEdited = true; 
        }else{
            return; 
        }
    }

    async getPrevSale(){
        let newProd = await getLastPaid({accountID: this.accountId, Code: this.productCode})
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
                    UnitPrice:this.agProduct ? this.unitCost: 0,
                    CPQ_Margin__c: 0,
                    Cost__c: this.unitCost,
                    lastPaid: newProd.Unit_Price__c,
                    lastMarg: this.agProduct ? '' : (newProd.Margin__c / 100),
                    TotalPrice: 0,
                    Floor_Price__c: this.floorPrice,
                    Floor_Type__c: this.floorType,
                    readOnly: this.agProduct ? true : false,
                    editQTY: false,
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
                    UnitPrice: this.agProduct ? this.unitCost : 0,
                    lastPaid: 0,
                    lastMarg: this.agProduct ? 0: '', 
                    CPQ_Margin__c: 0,
                    Cost__c: this.unitCost,
                    TotalPrice: 0,
                    Floor_Price__c: this.floorPrice,
                    Floor_Type__c: this.floorType,
                    readOnly: this.agProduct ? true : false,
                    editQTY: false,
                    OpportunityId: this.oppId
                }
            ]
        }
    }
//handle the order total and pass this back to the flow to display on success screen
    orderTotal(products){
        const sum = products.reduce(function(a,b){
            return Number(a) + Number(b.TotalPrice);
        },0)
        return sum; 
    }
//handle show the save button options
    allowSave(){
        if(!this.wasEdited){
            this.wasEdited = true; 
        }
    }
    handleCloseSearch(){    
        this.addProducts = false; 
    }
}