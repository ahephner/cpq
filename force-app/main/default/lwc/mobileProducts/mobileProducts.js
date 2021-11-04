import { deleteRecord } from 'lightning/uiRecordApi';
import { LightningElement, api, track } from 'lwc';

export default class MobileProducts extends LightningElement {
    showDelete = false; 
    @track prod = [] 
    @api backUp = [];
    prodData; 
    loaded = true; 
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
        let buttonGroup
        this.prod =  p.map(x=>{
            readOnly = true;
            buttonGroup = false; 
            icon = 'utility:edit'
            return {...x, readOnly, icon, buttonGroup}
        })
        this.backUp = [...this.prod]
        console.log('prod '+this.prod);
        console.log('backUp '+this.backUp);
    }

    edit(e){
        let index = this.prod.findIndex(x=>x.Id === e.target.name)
        //need to do more in here like show a delete button.
        if(this.prod[index].icon === 'utility:edit'){
            this.prod[index].icon = 'utility:close';
            this.prod[index].readOnly = false;
            this.prod[index].buttonGroup = true
        } else{
            this.prod[index].icon = 'utility:edit';
            this.prod[index].readOnly = true;
            this.prod[index].buttonGroup = false; 
        }
    }

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
            
            
            // if((1- (this.prod[index].CPQ_Margin__c/100)) > 0){
            //     this.prod[index].UnitPrice = Number(this.prod[index].Cost__c / (1- this.selection[index].CPQ_Margin__c/100)).toFixed(2)
            //     console.log('up '+ this.prod[index].UnitPrice);
                
            // }
        },500)
    }
//delete individual line items. 
    handleDelete(x){
        let index = this.prod.findIndex(prod => prod.Id === x.target.name)
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

    }
}