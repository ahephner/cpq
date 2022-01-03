import { deleteRecord } from 'lightning/uiRecordApi';
import { LightningElement, api, track } from 'lwc';
import createProducts from '@salesforce/apex/cpqApex.createProducts';
import getLastPaid from '@salesforce/apex/cpqApex.getLastPaid'; 
import getInventory from '@salesforce/apex/cpqApex.getInventory';
import onLoadGetInventory from '@salesforce/apex/cpqApex.onLoadGetInventory';
import onLoadGetLastPaid from '@salesforce/apex/cpqApex.onLoadGetLastPaid';
import { FlowNavigationNextEvent,FlowAttributeChangeEvent, FlowNavigationBackEvent  } from 'lightning/flowSupport';
import { mobileLoad, mobileLastPaid, mobileMergeInv} from 'c/mobileHelper';

export default class MobileProducts extends LightningElement {
    showDelete = false;  
    addProducts = false;
    wasEdited = false;  
    @track prod = [] 
    @api backUp = [];
    @api results; 
    @api oppId; 
    @api totalPrice;
    @api accId; 
    wh; 
    whId; 
    recId;
    prodData; 
    showSpinner = true;
    productCode;
    productName;
    productId;
    pbeId;
    unitCost;
    levelOne;
    levelTwo; 
    agProduct;
    floorType;
    floorPrice;
    invCount;  
    editAllText = 'Edit All';
    //minimum amount of units per line item
    minUnits = 1
    //on screen load
    connectedCallback(){
        this.showSpinner = false; 
        console.log('acc id' +this.accId)
        if(this.prodData){
            this.load(this.prodData)
        }
    }
    @api 
    get warehouseId(){
        return this.whId || [];
    }
    set warehouseId(data){
        this.whId = data; 
    }
    //get products passed in from the flow
    @api 
    get products(){  
        return this.prodData || [];
    } 
//setting products from passed in from the flow
    set products(data){
        this.prodData = data; 
        //this.load(this.prodData);        
    }

      async load(selItems){
        //inventory vars
        console.log('load');
        
        let inSet = new Set();
        let prodIdInv = [];   
        let inCode = new Set();
        let codes = [];
        try{
            selItems.forEach(item=>{
                inSet.add(item.Product2Id);
                inCode.add(item.ProductCode);
            })
            prodIdInv = [...inSet];
            codes = [...inCode];
            if(prodIdInv){
                console.log('apex calls');
                
                let invenCheck =  await onLoadGetInventory({locId: this.whId, pIds: prodIdInv});
                
                let lastPaid = await onLoadGetLastPaid({accountId:this.accId,productCodes:codes })
                console.log('lp '+JSON.stringify(lastPaid));
                
                let mergedProducts =  await mobileMergeInv(selItems, invenCheck);
                let mergedLastPaid = await mobileLastPaid(mergedProducts, lastPaid);
                this.prod = await mobileLoad(mergedLastPaid);  
                            
            }
            this.backUp = [...this.prod]
        }catch(error){

        }finally{
         
         this.showSpinner = false; 
        }
       }
    // load(p){
    //         let readOnly
    //         let editQTY; 
    //         let icon
    //         let showInfo 
    //         this.prod =  p.map(x=>{
    //             readOnly = true;
    //             showInfo = false;  
    //             editQTY = true; 
    //             icon = 'utility:edit'
    //             return {...x, readOnly, icon, showInfo, editQTY}
    //         })
    //         this.backUp = [...this.prod]
    //         this.showSpinner = false; 
    //        // console.log(JSON.stringify(this.prod))    
    // }

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
    //handles showing the user prompts
    handleWarning = (targ, lev, cost, price)=>{
        console.log(1, targ, 2, lev, 3, cost, 4, price);
        
        if(price > lev){
            this.template.querySelector(`[data-id="${targ}"]`).style.color ="black";
            this.template.querySelector(`[data-target-id="${targ}"]`).style.color ="black";
            
        }else if(price<lev && price>cost){
            console.log('warn');
            
            this.template.querySelector(`[data-id="${targ}"]`).style.color ="orange";
            this.template.querySelector(`[data-target-id="${targ}"]`).style.color ="orange";
            
        }else if(price<cost){
            this.template.querySelector(`[data-id="${targ}"]`).style.color ="red";
            this.template.querySelector(`[data-target-id="${targ}"]`).style.color ="red";
            
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
            let cst = Number(this.prod[index].Cost__c);
            let unitp = Number(this.prod[index].UnitPrice);
            console.log(1, targetId, 2, lOne, 3, cst, 4, unitp);
            
            this.handleWarning(targetId,lOne, cst, unitp );
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
            let cst = Number(this.prod[index].Cost__c);
            let unitp = Number(this.prod[index].UnitPrice);
            this.handleWarning(targetId,lOne, cst, unitp )
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
    handleNewProduct(prodx){
        this.productCode = prodx.detail.ProductCode;
        this.productName = prodx.detail.Name;
        this.productId = prodx.detail.Product2Id;
        this.pbeId = prodx.detail.Id;
        this.unitCost = prodx.detail.UnitPrice;
        this.agProduct = prodx.detail.agency;
        this.floorPrice = prodx.detail.Product2.Floor_Price__c;
        this.floorType = prodx.detail.Product2.Floor_Type__c;
        this.levelOne = prodx.detail.Level_1_Price__c; 
        this.levelTwo = prodx.detail.Level_2_Price__c;
        //console.log('2 '+this.levelOne);
        
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
                    UnitPrice:this.agProduct ? this.unitCost: 0,
                    lOne: this.agency? this.unitCost : this.levelOne,
                    lTwo: this.levelTwo,
                    CPQ_Margin__c: 0,
                    Cost__c: this.unitCost,
                    lastPaid: newProd.Unit_Price__c,
                    lastMarg: this.agProduct ? '' : (newProd.Margin__c / 100),
                    TotalPrice: 0,
                    Floor_Price__c: this.floorPrice,
                    Floor_Type__c: this.floorType,
                    wInv:  !this.invCount ? 0 :this.invCount.QuantityOnHand,
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
                    lOne: this.agency? this.unitCost : this.levelOne,
                    lTwo: this.levelTwo,
                    lastPaid: 0,
                    lastMarg: this.agProduct ? 0: '', 
                    CPQ_Margin__c: 0,
                    Cost__c: this.unitCost,
                    TotalPrice: 0,
                    Floor_Price__c: this.floorPrice,
                    Floor_Type__c: this.floorType,
                    wInv:  !this.invCount ? 0 :this.invCount.QuantityOnHand,
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
    //wareHouse info
    get wareHouses(){
        return [
            {label:'200 | ATS Louisville', value:'1311D0000001O7TQAU'},
            {label:'400 | ATS Columbus', value:'1311D0000001O7OQAU'},
            {label:'115 | ATS Fishers', value:'1311D0000001NOaQAM'},
            {label:'600 | ATS - Elkhart', value:'1311D0000001O7JQAU'},
        ]
    }

    whChange(x){
        this.wh = x.detail.value;
    }
}