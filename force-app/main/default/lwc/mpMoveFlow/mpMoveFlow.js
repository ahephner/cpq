import { deleteRecord } from 'lightning/uiRecordApi';
import { LightningElement, api, track } from 'lwc';
import createProducts from '@salesforce/apex/cpqApex.createProducts';
import { FlowNavigationNextEvent,FlowAttributeChangeEvent, FlowNavigationBackEvent  } from 'lightning/flowSupport';

export default class MobileProducts extends LightningElement {
    showDelete = false;  
    addProducts = false; 
    @track prod = [] 
    @api backUp = [];
    @api results; 
    prodData; 
    showSpinner = true; 
    connectedCallback(){
        //this.load(this.products);
        //this.load(this.prod); 
    }
    
    @api 
    get products(){
        return this.prodData || [];
    } 

    set products(data){
        this.prodData = data; 
        console.log(1, this.prodData)
        this.load(this.prodData);
    }
    load(p){
        let readOnly
        let icon
        let showInfo 
        this.prod =  p.map(x=>{
            readOnly = true;
            showInfo = false;  
            icon = 'utility:edit'
            return {...x, readOnly, icon, showInfo}
        })
        this.backUp = [...this.prod]
        this.showSpinner = false; 
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
       edit(index){
           if(this.prod[index].readOnly === false && this.prod[index].showInfo === false){
            this.prod[index].readOnly = true;
           }else if(this.prod[index].readOnly === false && this.prod[index].showInfo === true){
            this.prod[index].showInfo = false; 
            this.prod[index].readOnly = false;
           }else{
               this.prod[index].readOnly = false
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
        let index = this.prod.findIndex(prod => prod.Id === qty.target.name);
        this.prod[index].Quantity = Number(qty.detail.value);
        //handle total price change
        if(this.prod[index].UnitPrice > 0){
            this.prod[index].TotalPrice = this.prod[index].Quantity * this.prod[index].UnitPrice; 
        }
    }

    handlePrice(p){
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
            this.prod = result;
            this.showSpinner = false; 
            //un comment this if you want to move the flow screen to a next action
            let mess = 'success';
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
    }

    handleNext(){
        const nextNav = new FlowNavigationNextEvent();
        this.dispatchEvent(nextNav);
    }

    openProducts(){
        // this.template.querySelector('c-mobile-search').openSearch();
        this.addProducts = true; 
        
    }
}